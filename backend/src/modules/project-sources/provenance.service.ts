import { randomUUID } from 'node:crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Database, Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { ProjectAccess, requireLifecycle } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { advanceChangeStamp } from '../../shared/concurrency/change-stamp.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { SourceRepository } from './source.repository.js';
import { projectSources } from '../../shared/database/schema.js';
import { sourceReferences, ingestionRuns, ingestionRunReferences } from './provenance.schema.js';
import type { ReferenceInput, IngestionInput, IngestionTransition } from './provenance.input.js';
type Run = typeof ingestionRuns.$inferSelect;
const terminal = (state: Run['state']) => !['PENDING', 'RUNNING'].includes(state);
export class ProvenanceService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
  ) {}
  private async source(db: Executor, projectId: string, sourceId: string) {
    const source = await new SourceRepository(db).get(projectId, sourceId);
    if (!source) throw new AppError('DOMAIN_NOT_FOUND', 'Source not found.');
    return source;
  }
  private async references(db: Executor, sourceId: string, revision: string, ids: string[]) {
    if (!ids.length) return;
    const rows = await db
      .select()
      .from(sourceReferences)
      .where(
        and(
          eq(sourceReferences.sourceId, sourceId),
          eq(sourceReferences.revision, revision),
          inArray(sourceReferences.id, [...new Set(ids)]),
        ),
      );
    if (rows.length !== new Set(ids).size)
      throw new AppError('DOMAIN_NOT_FOUND', 'Exact source revision reference not found.');
  }
  async list(
    principal: Principal,
    projectId: string,
    sourceId: string,
    kind: 'references' | 'runs',
  ) {
    return this.db.transaction(async (tx) => {
      await new ProjectAccess(tx).read(principal, projectId);
      await this.source(tx, projectId, sourceId);
      if (kind === 'references')
        return tx.select().from(sourceReferences).where(eq(sourceReferences.sourceId, sourceId));
      const runs = await tx
        .select()
        .from(ingestionRuns)
        .where(eq(ingestionRuns.sourceId, sourceId));
      return Promise.all(
        runs.map(async (run) => ({
          ...run,
          references: await tx
            .select({
              referenceId: ingestionRunReferences.referenceId,
              role: ingestionRunReferences.role,
            })
            .from(ingestionRunReferences)
            .where(eq(ingestionRunReferences.runId, run.id)),
        })),
      );
    });
  }
  async command(
    principal: Principal,
    projectId: string,
    sourceId: string,
    input: ReferenceInput | IngestionInput | IngestionTransition,
    runId?: string,
  ) {
    const kind =
      'locator' in input
        ? 'source.reference.create'
        : 'revision' in input
          ? 'source.ingestion.create'
          : 'source.ingestion.transition';
    const committed = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: kind,
        scope: { kind: 'project', id: projectId },
      },
      semanticRequest: { projectId, sourceId, ...(runId ? { runId } : {}), input },
      authorize: async ({ tx }, result) => {
        await new ProjectAccess(tx).read(principal, projectId);
        await this.source(tx, projectId, sourceId);
        if (result) {
          const table =
            result.reference.kind === 'source_reference' ? sourceReferences : ingestionRuns;
          const [row] = await tx
            .select({ sourceId: table.sourceId })
            .from(table)
            .where(eq(table.id, result.reference.id));
          if (row?.sourceId !== sourceId)
            throw new AppError('DOMAIN_NOT_FOUND', 'Result not found.');
        }
      },
      execute: async (context) => {
        const { tx } = context;
        await new ProjectAccess(tx).editorOrOwner(principal, projectId);
        // Serialize attempt creation, transitions, and legacy deletion on the existing Source owner row.
        await tx
          .select({ id: projectSources.id })
          .from(projectSources)
          .where(eq(projectSources.id, sourceId))
          .for('update');
        const source = await this.source(tx, projectId, sourceId);
        if ('locator' in input) {
          const valid =
            source.sourceType === 'MIRO'
              ? input.locator.kind === 'MIRO'
              : source.sourceType === 'OPENAPI'
                ? input.locator.kind === 'OPENAPI'
                : ['DOCUMENT', 'ARTIFACT'].includes(input.locator.kind);
          if (!valid) throw new AppError('VALIDATION_ERROR', 'Locator does not match source type.');
          const [inserted] = await tx
            .insert(sourceReferences)
            .values({ sourceId, revision: input.revision, locator: input.locator })
            .onConflictDoNothing()
            .returning();
          const [existing] = inserted
            ? [inserted]
            : await tx
                .select()
                .from(sourceReferences)
                .where(
                  and(
                    eq(sourceReferences.sourceId, sourceId),
                    eq(sourceReferences.revision, input.revision),
                    sql`${sourceReferences.locator} = ${JSON.stringify(input.locator)}::jsonb`,
                  ),
                );
          if (!existing) throw new AppError('DOMAIN_CONFLICT', 'Reference unavailable.');
          return { reference: { kind: 'source_reference', id: existing.id }, status: 'CREATED' };
        }
        let run: Run;
        if ('revision' in input) {
          const active = await tx
            .select({ id: ingestionRuns.id })
            .from(ingestionRuns)
            .where(
              and(
                eq(ingestionRuns.sourceId, sourceId),
                inArray(ingestionRuns.state, ['PENDING', 'RUNNING']),
              ),
            );
          if (active.length)
            throw new AppError('DOMAIN_CONFLICT', 'An ingestion attempt is already active.');
          if (input.retryOf) {
            const [previous] = await tx
              .select()
              .from(ingestionRuns)
              .where(
                and(eq(ingestionRuns.id, input.retryOf), eq(ingestionRuns.sourceId, sourceId)),
              );
            requireLifecycle(!!previous && terminal(previous.state));
          }
          await this.references(tx, sourceId, input.revision, input.inputReferenceIds);
          const [created] = await tx
            .insert(ingestionRuns)
            .values({
              sourceId,
              inputRevision: input.revision,
              retryOf: input.retryOf,
              state: 'PENDING',
            })
            .returning();
          run = created!;
          if (input.inputReferenceIds.length)
            await tx
              .insert(ingestionRunReferences)
              .values(
                [...new Set(input.inputReferenceIds)].map((referenceId) => ({
                  runId: run.id,
                  referenceId,
                  role: 'INPUT' as const,
                })),
              );
        } else {
          const [current] = await tx
            .select()
            .from(ingestionRuns)
            .where(and(eq(ingestionRuns.id, runId!), eq(ingestionRuns.sourceId, sourceId)))
            .for('update');
          if (!current) throw new AppError('DOMAIN_NOT_FOUND', 'Ingestion attempt not found.');
          requireLifecycle(!terminal(current.state));
          const stamp = advanceChangeStamp(current.changeStamp, input.expectedStamp);
          requireLifecycle(
            input.action === 'CANCEL' ||
              (input.action === 'START'
                ? current.state === 'PENDING'
                : current.state === 'RUNNING'),
          );
          const state =
            input.action === 'START'
              ? 'RUNNING'
              : input.action === 'SUCCEED'
                ? 'SUCCEEDED'
                : input.action === 'FAIL'
                  ? 'FAILED'
                  : 'CANCELLED';
          if (input.action === 'SUCCEED') {
            await this.references(tx, sourceId, current.inputRevision, input.outputReferenceIds);
            if (input.outputReferenceIds.length)
              await tx
                .insert(ingestionRunReferences)
                .values(
                  [...new Set(input.outputReferenceIds)].map((referenceId) => ({
                    runId: current.id,
                    referenceId,
                    role: 'OUTPUT' as const,
                  })),
                );
          }
          const [updated] = await tx
            .update(ingestionRuns)
            .set({
              state,
              changeStamp: stamp,
              completedAt: terminal(state) ? new Date() : null,
              failureCode: input.action === 'FAIL' ? input.failureCode : null,
            })
            .where(
              and(
                eq(ingestionRuns.id, current.id),
                eq(ingestionRuns.changeStamp, current.changeStamp),
              ),
            )
            .returning();
          run = updated!;
          await tx
            .update(projectSources)
            .set({
              status:
                state === 'RUNNING'
                  ? 'PROCESSING'
                  : state === 'SUCCEEDED'
                    ? 'READY'
                    : state === 'FAILED'
                      ? 'FAILED'
                      : source.storageKey
                        ? 'UPLOADED'
                        : source.externalReference
                          ? 'CONNECTED'
                          : 'PENDING',
            })
            .where(eq(projectSources.id, sourceId));
        }
        context.emit({
          id: randomUUID(),
          kind: 'source.ingestion.changed',
          aggregate: { kind: 'ingestion_run', id: run.id },
          changeStamp: run.changeStamp,
        });
        return {
          reference: { kind: 'ingestion_run', id: run.id },
          status: run.state,
          changeStamp: run.changeStamp,
        };
      },
    });
    const { result, replayed } = committed.result;
    return {
      id: result.reference.id,
      state: result.status,
      ...(result.changeStamp !== undefined ? { changeStamp: result.changeStamp } : {}),
      replayed,
    };
  }
}
