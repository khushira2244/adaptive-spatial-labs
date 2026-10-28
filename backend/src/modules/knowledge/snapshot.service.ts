import type { MeetingKnowledgePolicy } from './knowledge.meeting-policy.js';
import { randomUUID } from 'node:crypto';
import type { Database, Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { AppError } from '../../shared/errors/app-error.js';
import { snapshots } from './knowledge.schema.js';
import { KnowledgeRepository } from './knowledge.repository.js';
import { privateAccess } from './knowledge.access.js';
import { architectureContext, contextProject } from './knowledge.context.js';
import { authorRef } from './knowledge.ownership.js';
import type { CreateSnapshotInput, PrivateQuery } from './knowledge.input.js';
export class SnapshotService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private policy?: MeetingKnowledgePolicy,
  ) {}
  async readIn(db: Executor, principal: Principal, id: string) {
    const row = await new KnowledgeRepository(db).snapshot(id, principal.actor);
    if (!row) throw new AppError('DOMAIN_NOT_FOUND', 'Private resource not found.');
    await privateAccess(db, principal, row.projectId, row.meetingId, this.policy);
    const anchorProject = await contextProject(
      db,
      principal,
      row.scope,
      row.projectId,
      row.meetingId,
      this.policy,
    );
    await architectureContext(db, principal, anchorProject, row.scope, {
      snapshot: true,
      ...(row.meetingId ? { meetingId: row.meetingId, policy: this.policy } : {}),
      read: true,
    });
    await privateAccess(db, principal, row.projectId, row.meetingId, this.policy);
    return {
      id: row.id,
      creator: authorRef(row),
      projectId: row.projectId,
      meetingId: row.meetingId,
      visibility: row.visibility,
      scope: row.scope,
      payload: row.payload,
      createdAt: row.createdAt,
    };
  }
  read(principal: Principal, id: string) {
    return this.db.transaction((tx) => this.readIn(tx, principal, id));
  }
  async create(principal: Principal, input: CreateSnapshotInput) {
    const committed = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST' && input.meetingId
        ? { invitedScope: { kind: 'MEETING' as const, id: input.meetingId } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'snapshot.create',
        ...(input.meetingId
          ? { scope: { kind: 'meeting', id: input.meetingId } }
          : input.projectId
            ? { scope: { kind: 'project', id: input.projectId } }
            : {}),
      },
      semanticRequest: input,
      authorize: async ({ tx }, result) => {
        await privateAccess(tx, principal, input.projectId, input.meetingId, this.policy);
        await contextProject(
          tx,
          principal,
          input.scope,
          input.projectId,
          input.meetingId,
          this.policy,
        );
        if (result) await this.readIn(tx, principal, result.reference.id);
      },
      execute: async (context) => {
        const { tx } = context;
        const actor = await privateAccess(
          tx,
          principal,
          input.projectId,
          input.meetingId,
          this.policy,
        );
        const anchorProject = await contextProject(
          tx,
          principal,
          input.scope,
          input.projectId,
          input.meetingId,
          this.policy,
        );
        await architectureContext(tx, principal, anchorProject, input.scope, {
          snapshot: true,
          ...(input.meetingId ? { meetingId: input.meetingId, policy: this.policy } : {}),
        });
        const [row] = await tx
          .insert(snapshots)
          .values({
            ...(actor.kind === 'USER' ? { userId: actor.userId } : { guestId: actor.guestId }),
            meetingId: input.meetingId,
            projectId: input.projectId,
            architectureId: input.scope.architectureId,
            graphId: input.scope.architectureGraphRef,
            scope: input.scope,
            payload: input.payload,
          })
          .returning();
        context.emit({
          id: randomUUID(),
          kind: 'snapshot.created',
          aggregate: { kind: 'snapshot', id: row!.id },
        });
        return { reference: { kind: 'snapshot', id: row!.id }, status: 'CREATED' };
      },
    });
    return { id: committed.result.result.reference.id, replayed: committed.result.replayed };
  }
  async listIn(db: Executor, principal: Principal, query: PrivateQuery) {
    await privateAccess(db, principal, query.projectId, query.meetingId, this.policy);
    const rows = await new KnowledgeRepository(db).list(principal.actor, query, 'snapshots');
    const visible: Awaited<ReturnType<SnapshotService['readIn']>>[] = [];
    for (const row of rows) {
      try {
        visible.push(await this.readIn(db, principal, row.id));
      } catch (error: unknown) {
        if (
          error instanceof AppError &&
          ['DOMAIN_NOT_FOUND', 'DOMAIN_FORBIDDEN'].includes(error.code)
        )
          continue;
        throw error;
      }
    }
    return { snapshots: visible, count: visible.length, limit: query.limit, offset: query.offset };
  }
  list(principal: Principal, query: PrivateQuery) {
    return this.db.transaction((tx) => this.listIn(tx, principal, query));
  }
}
