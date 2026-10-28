import { meetings } from '../meetings/meeting.schema.js';
import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  check,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users, projects } from '../../shared/database/schema.js';
import { scopedGuestAccess } from '../../shared/database/foundation-schema.js';
import { architectures, architectureGraphs } from '../architecture/architecture.schema.js';
import { sourceReferences } from '../project-sources/provenance.schema.js';
import type { Attachment, SemanticScope } from './knowledge.input.js';
const owners = () => ({
  userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
  guestId: uuid('guest_id').references(() => scopedGuestAccess.id, { onDelete: 'restrict' }),
});
export const knowledgeItems = pgTable(
  'knowledge_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ...owners(),
    meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'restrict' }),
    visibility: text('visibility').$type<'PRIVATE'>().default('PRIVATE').notNull(),
    category: text('category').$type<'NOTE' | 'QUESTION' | 'DISCUSSION_POINT'>().notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    state: text('state').$type<'ACTIVE' | 'ARCHIVED'>().notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check(
      'knowledge_actor_exclusive',
      sql`(${t.userId} IS NOT NULL) <> (${t.guestId} IS NOT NULL)`,
    ),
    check('knowledge_private_only', sql`${t.visibility}='PRIVATE'`),
    check('knowledge_category_valid', sql`${t.category} IN ('NOTE','QUESTION','DISCUSSION_POINT')`),
    check('knowledge_state_valid', sql`${t.state} IN ('ACTIVE','ARCHIVED')`),
    check('knowledge_stamp_valid', sql`${t.changeStamp}>=0`),
    index('knowledge_user_project_idx').on(t.userId, t.projectId),
    index('knowledge_guest_idx').on(t.guestId),
  ],
);
export const snapshots = pgTable(
  'snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ...owners(),
    meetingId: uuid('meeting_id').references(() => meetings.id, { onDelete: 'restrict' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'restrict' }),
    visibility: text('visibility').$type<'PRIVATE'>().default('PRIVATE').notNull(),
    architectureId: uuid('architecture_id').notNull(),
    graphId: uuid('graph_id').notNull(),
    scope: jsonb('scope').$type<SemanticScope>().notNull(),
    payload: jsonb('payload').$type<{ format: 1; title: string; caption: string }>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('snapshot_actor_exclusive', sql`(${t.userId} IS NOT NULL) <> (${t.guestId} IS NOT NULL)`),
    check('snapshot_private_only', sql`${t.visibility}='PRIVATE'`),
    foreignKey({
      columns: [t.architectureId],
      foreignColumns: [architectures.id],
      name: 'snapshot_architecture_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.graphId, t.architectureId],
      foreignColumns: [architectureGraphs.id, architectureGraphs.architectureId],
      name: 'snapshot_graph_family_fk',
    }).onDelete('restrict'),
    index('snapshot_user_project_idx').on(t.userId, t.projectId),
    index('snapshot_guest_idx').on(t.guestId),
  ],
);
export const knowledgeContexts = pgTable(
  'knowledge_contexts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    itemId: uuid('item_id')
      .notNull()
      .references(() => knowledgeItems.id, { onDelete: 'restrict' }),
    kind: text('kind').$type<Attachment['kind']>().notNull(),
    architectureId: uuid('architecture_id').references(() => architectures.id, {
      onDelete: 'restrict',
    }),
    graphId: uuid('graph_id'),
    nodeId: uuid('node_id'),
    connectionId: uuid('connection_id'),
    innerLinkId: uuid('inner_link_id'),
    sourceReferenceId: uuid('source_reference_id').references(() => sourceReferences.id, {
      onDelete: 'restrict',
    }),
    snapshotId: uuid('snapshot_id').references(() => snapshots.id, { onDelete: 'restrict' }),
    descriptor: jsonb('descriptor').$type<Attachment>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.graphId, t.architectureId],
      foreignColumns: [architectureGraphs.id, architectureGraphs.architectureId],
      name: 'knowledge_context_graph_family_fk',
    }).onDelete('restrict'),
    check(
      'knowledge_context_target_valid',
      sql`
 (${t.kind}='ARCHITECTURE' AND ${t.architectureId} IS NOT NULL AND ${t.graphId} IS NOT NULL AND ${t.sourceReferenceId} IS NULL AND ${t.snapshotId} IS NULL)
 OR (${t.kind}='SOURCE_REFERENCE' AND ${t.sourceReferenceId} IS NOT NULL AND ${t.architectureId} IS NULL AND ${t.graphId} IS NULL AND ${t.snapshotId} IS NULL AND ${t.nodeId} IS NULL AND ${t.connectionId} IS NULL AND ${t.innerLinkId} IS NULL)
 OR (${t.kind}='SNAPSHOT' AND ${t.snapshotId} IS NOT NULL AND ${t.architectureId} IS NULL AND ${t.graphId} IS NULL AND ${t.sourceReferenceId} IS NULL AND ${t.nodeId} IS NULL AND ${t.connectionId} IS NULL AND ${t.innerLinkId} IS NULL)`,
    ),
    index('knowledge_context_current_idx').on(t.itemId, t.endedAt),
    index('knowledge_context_graph_idx').on(t.graphId),
  ],
);
