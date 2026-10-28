import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { users } from './schema.js';
import type { OperationResult } from '../operations/operation-input.js';

// Scope IDs are intentionally opaque until the invited domain is implemented.
// Provisioning is server-only; future invitation use cases must validate the actual parent scope.
export const scopedGuestAccess = pgTable(
  'scoped_guest_access',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scopeKind: text('scope_kind').$type<'PRESENTATION' | 'MEETING'>().notNull(),
    scopeId: uuid('scope_id').notNull(),
    tokenDigest: text('token_digest').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('scoped_guest_token_unique').on(t.tokenDigest),
    index('scoped_guest_scope_idx').on(t.scopeKind, t.scopeId),
    check('scoped_guest_kind_valid', sql`${t.scopeKind} IN ('PRESENTATION', 'MEETING')`),
    check('scoped_guest_digest_valid', sql`${t.tokenDigest} ~ '^[a-f0-9]{64}$'`),
  ],
);

export const operationResults = pgTable(
  'operation_results',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
    guestId: uuid('guest_id').references(() => scopedGuestAccess.id, { onDelete: 'restrict' }),
    commandKind: text('command_kind').notNull(),
    scopeKind: text('scope_kind'),
    scopeId: uuid('scope_id'),
    requestFingerprint: text('request_fingerprint').notNull(),
    state: text('state').$type<'RUNNING' | 'COMPLETED'>().notNull(),
    result: jsonb('result').$type<OperationResult>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'operation_actor_exclusive',
      sql`(${t.userId} IS NOT NULL) <> (${t.guestId} IS NOT NULL)`,
    ),
    check('operation_scope_complete', sql`(${t.scopeKind} IS NULL) = (${t.scopeId} IS NULL)`),
    check('operation_fingerprint_valid', sql`${t.requestFingerprint} ~ '^[a-f0-9]{64}$'`),
    check(
      'operation_completion_valid',
      sql`(
    ${t.state} = 'RUNNING' AND ${t.result} IS NULL AND ${t.completedAt} IS NULL
  ) OR (
    ${t.state} = 'COMPLETED' AND ${t.result} IS NOT NULL AND ${t.completedAt} IS NOT NULL
  )`,
    ),
    index('operation_user_idx').on(t.userId),
    index('operation_guest_idx').on(t.guestId),
  ],
);
