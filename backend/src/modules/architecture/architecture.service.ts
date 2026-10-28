import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { ProjectAccess, requireLifecycle } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { advanceChangeStamp, requireChangedRow } from '../../shared/concurrency/change-stamp.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { requireProjectReferences } from '../project-sources/provenance.contract.js';
import { architectures, architectureGraphs } from './architecture.schema.js';
import { ArchitectureRepository } from './architecture.repository.js';
import { validateFamily, provenanceIds } from './architecture.validation.js';
import { correct } from './architecture.corrections.js';
import type { InitializeInput, CorrectionInput, ConfirmInput } from './architecture.input.js';
export class ArchitectureService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
  ) {}
  async read(principal: Principal, projectId: string, graphId?: string) {
    return this.db.transaction(async (tx) => {
      await new ProjectAccess(tx).read(principal, projectId);
      const repository = new ArchitectureRepository(tx);
      const architecture = await repository.get(projectId, true);
      if (!architecture) throw new AppError('DOMAIN_NOT_FOUND', 'Architecture not found.');
      if (architecture.state === 'CANDIDATE')
        await new ProjectAccess(tx).owner(principal, projectId, true);
      const family = await repository.load(architecture.id);
      if (graphId) {
        const graph = family.graphs.find((g) => g.id === graphId);
        if (!graph) throw new AppError('DOMAIN_NOT_FOUND', 'Graph not found.');
        return {
          architectureId: architecture.id,
          state: architecture.state,
          changeStamp: architecture.changeStamp,
          graph,
        };
      }
      return {
        id: architecture.id,
        projectId,
        state: architecture.state,
        changeStamp: architecture.changeStamp,
        family,
        correction:
          architecture.state === 'CANDIDATE'
            ? {
                phase: architecture.correctionState.phase,
                undoCount: architecture.correctionState.undo.length,
                redoCount: architecture.correctionState.redo.length,
                checkpoint: architecture.correctionState.checkpoint ?? null,
              }
            : null,
      };
    });
  }
  async command(
    principal: Principal,
    projectId: string,
    kind: 'initialize' | 'correct' | 'confirm',
    input: InitializeInput | CorrectionInput | ConfirmInput,
  ) {
    try {
      const committed = await this.writes.run({
        principal,
        operation: {
          id: input.operationId,
          commandKind: 'architecture.' + kind,
          scope: { kind: 'project', id: projectId },
        },
        semanticRequest: { projectId, kind, input },
        authorize: async ({ tx }, result) => {
          await new ProjectAccess(tx).owner(principal, projectId, true);
          if (result) {
            const row = await new ArchitectureRepository(tx).get(projectId);
            if (row?.id !== result.reference.id)
              throw new AppError('DOMAIN_NOT_FOUND', 'Architecture not found.');
          }
        },
        execute: async (context) => {
          const { tx } = context;
          await new ProjectAccess(tx).owner(principal, projectId);
          const repository = new ArchitectureRepository(tx);
          let architecture = await repository.get(projectId, true);
          if (kind === 'initialize') {
            requireLifecycle(!architecture);
            const family = validateFamily((input as InitializeInput).proposal);
            await requireProjectReferences(tx, projectId, provenanceIds(family));
            const [created] = await tx
              .insert(architectures)
              .values({
                projectId,
                state: 'CANDIDATE',
                correctionState: { phase: 'REVIEW', undo: [], redo: [] },
              })
              .returning();
            architecture = created!;
            await repository.insert(architecture.id, family);
          } else {
            if (!architecture) throw new AppError('DOMAIN_NOT_FOUND', 'Architecture not found.');
            requireLifecycle(architecture.state === 'CANDIDATE');
            const stamp = advanceChangeStamp(
              architecture.changeStamp,
              (input as ConfirmInput).expectedStamp,
            );
            const family = validateFamily(await repository.load(architecture.id));
            await requireProjectReferences(tx, projectId, provenanceIds(family));
            if (kind === 'correct') {
              const next = correct(family, architecture.correctionState, input as CorrectionInput);
              await requireProjectReferences(tx, projectId, provenanceIds(next.family));
              await repository.save(architecture.id, family, next.family);
              const [updated] = await tx
                .update(architectures)
                .set({ changeStamp: stamp, correctionState: next.recovery })
                .where(
                  and(
                    eq(architectures.id, architecture.id),
                    eq(architectures.changeStamp, architecture.changeStamp),
                  ),
                )
                .returning();
              architecture = requireChangedRow(updated);
            } else {
              // The full tree is validated before any freeze; all graph and root writes share this transaction.
              await tx
                .update(architectureGraphs)
                .set({ state: 'CONFIRMED' })
                .where(eq(architectureGraphs.architectureId, architecture.id));
              const [updated] = await tx
                .update(architectures)
                .set({
                  state: 'CONFIRMED',
                  confirmedAt: new Date(),
                  changeStamp: stamp,
                  correctionState: { phase: 'CLOSED', undo: [], redo: [] },
                })
                .where(
                  and(
                    eq(architectures.id, architecture.id),
                    eq(architectures.changeStamp, architecture.changeStamp),
                  ),
                )
                .returning();
              architecture = requireChangedRow(updated);
            }
          }
          context.emit({
            id: randomUUID(),
            kind: 'architecture.' + kind,
            aggregate: { kind: 'architecture', id: architecture.id },
            changeStamp: architecture.changeStamp,
          });
          return {
            reference: { kind: 'architecture', id: architecture.id },
            status: architecture.state,
            changeStamp: architecture.changeStamp,
          };
        },
      });
      const { result, replayed } = committed.result;
      return {
        architectureId: result.reference.id,
        state: result.status,
        changeStamp: result.changeStamp,
        replayed,
      };
    } catch (error: unknown) {
      // Drizzle wraps PostgreSQL constraints; never disclose database identifiers or foreign family existence.
      const cause = error instanceof Error && 'cause' in error ? error.cause : error;
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
      if (code === '23505' || code === '23503')
        throw new AppError(
          'DOMAIN_CONFLICT',
          'Architecture identity conflicts with retained data.',
        );
      throw error;
    }
  }
}
