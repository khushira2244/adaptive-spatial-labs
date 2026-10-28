import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  primaryKey,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { projectSources } from '../../shared/database/schema.js';
import type { SourceLocator } from './provenance.input.js';

export const sourceReferences = pgTable(
  'source_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => projectSources.id, { onDelete: 'restrict' }),
    revision: text('revision').notNull(),
    locator: jsonb('locator').$type<SourceLocator>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('source_reference_origin_unique').on(t.sourceId, t.revision, t.locator)],
);

export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sourceId: uuid('source_id')
      .notNull()
      .references(() => projectSources.id, { onDelete: 'restrict' }),
    inputRevision: text('input_revision').notNull(),
    retryOf: uuid('retry_of').references((): AnyPgColumn => ingestionRuns.id, {
      onDelete: 'restrict',
    }),
    state: text('state')
      .$type<'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'>()
      .notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    failureCode: text('failure_code'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'ingestion_state_valid',
      sql`${t.state} IN ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')`,
    ),
    check('ingestion_stamp_valid', sql`${t.changeStamp} >= 0`),
    check(
      'ingestion_completion_valid',
      sql`(${t.state} IN ('PENDING','RUNNING') AND ${t.completedAt} IS NULL) OR (${t.state} IN ('SUCCEEDED','FAILED','CANCELLED') AND ${t.completedAt} IS NOT NULL)`,
    ),
    uniqueIndex('ingestion_active_source_unique')
      .on(t.sourceId)
      .where(sql`${t.state} IN ('PENDING','RUNNING')`),
  ],
);
export const ingestionRunReferences = pgTable(
  'ingestion_run_references',
  {
    runId: uuid('run_id')
      .notNull()
      .references(() => ingestionRuns.id, { onDelete: 'restrict' }),
    referenceId: uuid('reference_id')
      .notNull()
      .references(() => sourceReferences.id, { onDelete: 'restrict' }),
    role: text('role').$type<'INPUT' | 'OUTPUT'>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.runId, t.referenceId, t.role] }),
    check('ingestion_reference_role_valid', sql`${t.role} IN ('INPUT','OUTPUT')`),
  ],
);
