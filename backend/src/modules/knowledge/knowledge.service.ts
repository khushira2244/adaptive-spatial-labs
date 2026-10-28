import type { MeetingKnowledgePolicy } from './knowledge.meeting-policy.js';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { Database, Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { CommandTransactions } from '../../shared/database/command-transaction.js';
import { advanceChangeStamp, requireChangedRow } from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import { knowledgeItems } from './knowledge.schema.js';
import { KnowledgeRepository } from './knowledge.repository.js';
import { privateAccess, validateAttachments } from './knowledge.access.js';
import { authorRef, ownedBy } from './knowledge.ownership.js';
import type {
  CreateKnowledgeInput,
  UpdateKnowledgeInput,
  PrivateQuery,
} from './knowledge.input.js';
const missing = () => new AppError('DOMAIN_NOT_FOUND', 'Private resource not found.');
export class KnowledgeService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private transactions: CommandTransactions,
    private policy?: MeetingKnowledgePolicy,
  ) {}
  async readIn(db: Executor, principal: Principal, id: string) {
    const repo = new KnowledgeRepository(db);
    let row = await repo.item(id, principal.actor);
    if (!row) throw missing();
    await privateAccess(db, principal, row.projectId, row.meetingId, this.policy);
    row = await repo.item(id, principal.actor, true);
    if (!row) throw missing();
    const contexts = await repo.contexts(id);
    const statuses = await validateAttachments(
      db,
      principal,
      row.projectId,
      contexts.map((c) => c.descriptor),
      true,
      row.meetingId,
      this.policy,
    );
    await privateAccess(db, principal, row.projectId, row.meetingId, this.policy);
    return {
      id: row.id,
      author: authorRef(row),
      projectId: row.projectId,
      meetingId: row.meetingId,
      visibility: row.visibility,
      category: row.category,
      title: row.title,
      body: row.body,
      state: row.state,
      changeStamp: row.changeStamp,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      attachments: contexts.map((c, i) => ({
        id: c.id,
        descriptor: c.descriptor,
        status: statuses[i],
      })),
    };
  }
  read(principal: Principal, id: string) {
    return this.db.transaction((tx) => this.readIn(tx, principal, id));
  }
  async create(principal: Principal, input: CreateKnowledgeInput) {
    const committed = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST' && input.meetingId
        ? { invitedScope: { kind: 'MEETING' as const, id: input.meetingId } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'knowledge.create',
        ...(input.meetingId
          ? { scope: { kind: 'meeting', id: input.meetingId } }
          : input.projectId
            ? { scope: { kind: 'project', id: input.projectId } }
            : {}),
      },
      semanticRequest: input,
      authorize: async ({ tx }, result) => {
        await privateAccess(tx, principal, input.projectId, input.meetingId, this.policy);
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
        await validateAttachments(
          tx,
          principal,
          input.projectId,
          input.attachments,
          false,
          input.meetingId,
          this.policy,
        );
        const [row] = await tx
          .insert(knowledgeItems)
          .values({
            ...(actor.kind === 'USER' ? { userId: actor.userId } : { guestId: actor.guestId }),
            meetingId: input.meetingId,
            projectId: input.projectId,
            category: input.category,
            title: input.title,
            body: input.body,
            state: input.state,
          })
          .returning();
        await new KnowledgeRepository(tx).replaceContexts(row!.id, input.attachments);
        context.emit({
          id: randomUUID(),
          kind: 'knowledge.created',
          aggregate: { kind: 'knowledge_item', id: row!.id },
          changeStamp: 0,
        });
        return {
          reference: { kind: 'knowledge_item', id: row!.id },
          status: 'CREATED',
          changeStamp: 0,
        };
      },
    });
    return {
      id: committed.result.result.reference.id,
      changeStamp: committed.result.result.changeStamp,
      replayed: committed.result.replayed,
    };
  }
  async update(principal: Principal, id: string, input: UpdateKnowledgeInput) {
    const committed = await this.transactions.run(async (context) => {
      const { tx } = context;
      const repo = new KnowledgeRepository(tx);
      let row = await repo.item(id, principal.actor);
      if (!row) throw missing();
      await privateAccess(tx, principal, row.projectId, row.meetingId, this.policy);
      row = await repo.item(id, principal.actor, true);
      if (!row) throw missing();
      const stamp = advanceChangeStamp(row.changeStamp, input.expectedStamp);
      await validateAttachments(
        tx,
        principal,
        row.projectId,
        input.attachments,
        false,
        row.meetingId,
        this.policy,
      );
      const [updated] = await tx
        .update(knowledgeItems)
        .set({
          title: input.title,
          body: input.body,
          category: input.category,
          state: input.state,
          changeStamp: stamp,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(knowledgeItems.id, id),
            ownedBy(knowledgeItems, principal.actor),
            eq(knowledgeItems.changeStamp, input.expectedStamp),
          ),
        )
        .returning();
      requireChangedRow(updated);
      await repo.replaceContexts(id, input.attachments);
      await privateAccess(tx, principal, row.projectId, row.meetingId, this.policy);
      context.emit({
        id: randomUUID(),
        kind: 'knowledge.updated',
        aggregate: { kind: 'knowledge_item', id },
        changeStamp: stamp,
      });
      return { id, changeStamp: stamp };
    });
    return committed.result;
  }
  async listIn(db: Executor, principal: Principal, query: PrivateQuery) {
    await privateAccess(db, principal, query.projectId, query.meetingId, this.policy);
    const rows = await new KnowledgeRepository(db).list(principal.actor, query, 'items');
    const visible: Awaited<ReturnType<KnowledgeService['readIn']>>[] = [];
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
    return { items: visible, count: visible.length, limit: query.limit, offset: query.offset };
  }
  list(principal: Principal, query: PrivateQuery) {
    return this.db.transaction((tx) => this.listIn(tx, principal, query));
  }
}
