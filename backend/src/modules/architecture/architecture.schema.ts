import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  foreignKey,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { projects } from '../../shared/database/schema.js';
import { sourceReferences } from '../project-sources/provenance.schema.js';
import type { CorrectionState, GraphNode } from './architecture.input.js';

export const architectures = pgTable(
  'architectures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    state: text('state').$type<'CANDIDATE' | 'CONFIRMED'>().notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    correctionState: jsonb('correction_state').$type<CorrectionState>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('architecture_project_unique').on(t.projectId),
    check('architecture_state_valid', sql`${t.state} IN ('CANDIDATE','CONFIRMED')`),
    check('architecture_stamp_valid', sql`${t.changeStamp} >= 0`),
    check(
      'architecture_confirmation_valid',
      sql`(${t.state} = 'CANDIDATE' AND ${t.confirmedAt} IS NULL) OR (${t.state} = 'CONFIRMED' AND ${t.confirmedAt} IS NOT NULL)`,
    ),
  ],
);
export const architectureGraphs = pgTable(
  'architecture_graphs',
  {
    id: uuid('id').primaryKey(),
    architectureId: uuid('architecture_id')
      .notNull()
      .references(() => architectures.id, { onDelete: 'restrict' }),
    kind: text('kind').$type<'ROOT' | 'INNER'>().notNull(),
    name: text('name').notNull(),
    state: text('state').$type<'CANDIDATE' | 'CONFIRMED'>().notNull(),
  },
  (t) => [
    uniqueIndex('graph_family_identity_unique').on(t.id, t.architectureId),
    uniqueIndex('graph_root_unique')
      .on(t.architectureId)
      .where(sql`${t.kind} = 'ROOT'`),
    check('graph_kind_valid', sql`${t.kind} IN ('ROOT','INNER')`),
    check('graph_state_valid', sql`${t.state} IN ('CANDIDATE','CONFIRMED')`),
  ],
);
export const architectureNodes = pgTable(
  'architecture_nodes',
  {
    id: uuid('id').primaryKey(),
    graphId: uuid('graph_id')
      .notNull()
      .references(() => architectureGraphs.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    type: text('type').$type<GraphNode['type']>().notNull(),
    position: jsonb('position').$type<GraphNode['position']>().notNull(),
    description: text('description').notNull(),
    technology: text('technology').notNull(),
  },
  (t) => [
    uniqueIndex('node_graph_identity_unique').on(t.id, t.graphId),
    check(
      'node_type_valid',
      sql`${t.type} IN ('SERVICE','API','DATABASE','CACHE','QUEUE_EVENT','GATEWAY','FRONTEND_CLIENT','EXTERNAL_SYSTEM','GENERIC')`,
    ),
    check('node_plane_valid', sql`${t.position}->>'z' = '0'`),
  ],
);
export const architectureConnections = pgTable(
  'architecture_connections',
  {
    id: uuid('id').primaryKey(),
    graphId: uuid('graph_id')
      .notNull()
      .references(() => architectureGraphs.id, { onDelete: 'restrict' }),
    sourceNodeId: uuid('source_node_id').notNull(),
    destinationNodeId: uuid('destination_node_id').notNull(),
    relationship: text('relationship').notNull(),
    label: text('label').notNull(),
  },
  (t) => [
    uniqueIndex('connection_graph_identity_unique').on(t.id, t.graphId),
    foreignKey({
      columns: [t.sourceNodeId, t.graphId],
      foreignColumns: [architectureNodes.id, architectureNodes.graphId],
      name: 'connection_source_same_graph_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.destinationNodeId, t.graphId],
      foreignColumns: [architectureNodes.id, architectureNodes.graphId],
      name: 'connection_destination_same_graph_fk',
    }).onDelete('restrict'),
    check(
      'connection_relationship_valid',
      sql`${t.relationship} IN ('DEPENDS_ON','REQUEST','EVENT','DATA_FLOW','OTHER')`,
    ),
  ],
);
export const innerArchitectureReferences = pgTable(
  'inner_architecture_references',
  {
    id: uuid('id').primaryKey(),
    architectureId: uuid('architecture_id')
      .notNull()
      .references(() => architectures.id, { onDelete: 'restrict' }),
    parentGraphId: uuid('parent_graph_id').notNull(),
    parentNodeId: uuid('parent_node_id').notNull(),
    childGraphId: uuid('child_graph_id').notNull(),
  },
  (t) => [
    uniqueIndex('inner_parent_node_unique').on(t.parentNodeId),
    uniqueIndex('inner_child_graph_unique').on(t.childGraphId),
    foreignKey({
      columns: [t.parentGraphId, t.architectureId],
      foreignColumns: [architectureGraphs.id, architectureGraphs.architectureId],
      name: 'inner_parent_same_family_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.childGraphId, t.architectureId],
      foreignColumns: [architectureGraphs.id, architectureGraphs.architectureId],
      name: 'inner_child_same_family_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.parentNodeId, t.parentGraphId],
      foreignColumns: [architectureNodes.id, architectureNodes.graphId],
      name: 'inner_node_same_graph_fk',
    }).onDelete('restrict'),
    check('inner_not_self', sql`${t.parentGraphId} <> ${t.childGraphId}`),
  ],
);
export const graphProvenance = pgTable(
  'architecture_graph_provenance',
  {
    graphId: uuid('graph_id')
      .notNull()
      .references(() => architectureGraphs.id, { onDelete: 'restrict' }),
    referenceId: uuid('reference_id')
      .notNull()
      .references(() => sourceReferences.id, { onDelete: 'restrict' }),
  },
  (t) => [primaryKey({ columns: [t.graphId, t.referenceId] })],
);
export const nodeProvenance = pgTable(
  'architecture_node_provenance',
  {
    nodeId: uuid('node_id').notNull(),
    graphId: uuid('graph_id').notNull(),
    referenceId: uuid('reference_id')
      .notNull()
      .references(() => sourceReferences.id, { onDelete: 'restrict' }),
  },
  (t) => [
    primaryKey({ columns: [t.nodeId, t.referenceId] }),
    foreignKey({
      columns: [t.nodeId, t.graphId],
      foreignColumns: [architectureNodes.id, architectureNodes.graphId],
      name: 'node_provenance_owner_fk',
    }).onDelete('restrict'),
  ],
);
export const connectionProvenance = pgTable(
  'architecture_connection_provenance',
  {
    connectionId: uuid('connection_id').notNull(),
    graphId: uuid('graph_id').notNull(),
    referenceId: uuid('reference_id')
      .notNull()
      .references(() => sourceReferences.id, { onDelete: 'restrict' }),
  },
  (t) => [
    primaryKey({ columns: [t.connectionId, t.referenceId] }),
    foreignKey({
      columns: [t.connectionId, t.graphId],
      foreignColumns: [architectureConnections.id, architectureConnections.graphId],
      name: 'connection_provenance_owner_fk',
    }).onDelete('restrict'),
  ],
);
