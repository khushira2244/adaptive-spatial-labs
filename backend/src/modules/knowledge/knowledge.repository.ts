import { and, eq, isNull, inArray, desc } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { ActorRef } from '../../shared/auth/principal.js';
import { ownedBy } from './knowledge.ownership.js';
import { knowledgeItems, knowledgeContexts, snapshots } from './knowledge.schema.js';
import type { Attachment, PrivateQuery } from './knowledge.input.js';
export class KnowledgeRepository {
  constructor(private db: Executor) {}
  async item(id: string, actor: ActorRef, lock = false) {
    const q = this.db
      .select()
      .from(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), ownedBy(knowledgeItems, actor)));
    const [row] = lock ? await q.for('update') : await q;
    return row;
  }
  async snapshot(id: string, actor: ActorRef) {
    const [row] = await this.db
      .select()
      .from(snapshots)
      .where(and(eq(snapshots.id, id), ownedBy(snapshots, actor)));
    return row;
  }
  contexts(itemId: string) {
    return this.db
      .select()
      .from(knowledgeContexts)
      .where(and(eq(knowledgeContexts.itemId, itemId), isNull(knowledgeContexts.endedAt)))
      .orderBy(knowledgeContexts.id);
  }
  async replaceContexts(itemId: string, attachments: Attachment[]) {
    const current = await this.contexts(itemId);
    const retained = new Set<string>();
    const pending = [...current];
    for (const descriptor of attachments) {
      // Stable binding is retained when its exact owned descriptor is unchanged.
      const equal = (a: unknown, b: unknown): boolean => {
        if (a === b) return true;
        if (Array.isArray(a) && Array.isArray(b))
          return a.length === b.length && a.every((v, i) => equal(v, b[i]));
        if (a && b && typeof a === 'object' && typeof b === 'object') {
          const left = a as Record<string, unknown>,
            right = b as Record<string, unknown>;
          return (
            Object.keys(left).length === Object.keys(right).length &&
            Object.keys(left).every((k) => equal(left[k], right[k]))
          );
        }
        return false;
      };
      const old = pending.find((c) => equal(c.descriptor, descriptor));
      if (old) {
        retained.add(old.id);
        pending.splice(pending.indexOf(old), 1);
        continue;
      }
      const scope = descriptor.kind === 'ARCHITECTURE' ? descriptor.scope : undefined;
      await this.db.insert(knowledgeContexts).values({
        itemId,
        kind: descriptor.kind,
        descriptor,
        architectureId: scope?.architectureId,
        graphId: scope?.architectureGraphRef,
        nodeId: scope?.kind === 'NODE' ? scope.nodeRef : null,
        connectionId: scope?.kind === 'CONNECTION' ? scope.connectionRef : null,
        innerLinkId: scope?.kind === 'INNER_ARCHITECTURE' ? scope.innerLinkRef : null,
        sourceReferenceId:
          descriptor.kind === 'SOURCE_REFERENCE' ? descriptor.sourceReferenceId : null,
        snapshotId: descriptor.kind === 'SNAPSHOT' ? descriptor.snapshotId : null,
      });
    }
    for (const old of current)
      if (!retained.has(old.id))
        await this.db
          .update(knowledgeContexts)
          .set({ endedAt: new Date() })
          .where(eq(knowledgeContexts.id, old.id));
  }
  async list(actor: ActorRef, query: PrivateQuery, kind: 'items' | 'snapshots') {
    if (kind === 'snapshots')
      return this.db
        .select()
        .from(snapshots)
        .where(
          and(
            ownedBy(snapshots, actor),
            query.projectId ? eq(snapshots.projectId, query.projectId) : undefined,
            query.meetingId ? eq(snapshots.meetingId, query.meetingId) : undefined,
            query.graphId ? eq(snapshots.graphId, query.graphId) : undefined,
          ),
        )
        .orderBy(desc(snapshots.createdAt), snapshots.id)
        .limit(query.limit)
        .offset(query.offset);
    const graphItems = query.graphId
      ? this.db
          .select({ id: knowledgeContexts.itemId })
          .from(knowledgeContexts)
          .where(
            and(eq(knowledgeContexts.graphId, query.graphId), isNull(knowledgeContexts.endedAt)),
          )
      : undefined;
    return this.db
      .select()
      .from(knowledgeItems)
      .where(
        and(
          ownedBy(knowledgeItems, actor),
          query.projectId ? eq(knowledgeItems.projectId, query.projectId) : undefined,
          query.meetingId ? eq(knowledgeItems.meetingId, query.meetingId) : undefined,
          query.category ? eq(knowledgeItems.category, query.category) : undefined,
          graphItems ? inArray(knowledgeItems.id, graphItems) : undefined,
        ),
      )
      .orderBy(desc(knowledgeItems.createdAt), knowledgeItems.id)
      .limit(query.limit)
      .offset(query.offset);
  }
}
