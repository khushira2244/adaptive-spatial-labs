import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  check,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { users, projects } from '../../shared/database/schema.js';
import { scopedGuestAccess } from '../../shared/database/foundation-schema.js';
import { architectures } from '../architecture/architecture.schema.js';
import type { Draft, Inclusion } from './presentation.input.js';
const time = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
export const presentations = pgTable(
  'presentations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    architectureId: uuid('architecture_id')
      .notNull()
      .references(() => architectures.id),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    purpose: text('purpose').notNull(),
    state: text('state').$type<'PREPARING' | 'READY'>().notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    selectedScreenId: uuid('selected_screen_id'),
    createdAt: time(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check('presentation_state', sql`${t.state} IN ('PREPARING','READY') AND ${t.changeStamp}>=0`),
  ],
);
export const presentationGrants = pgTable(
  'presentation_access_grants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id),
    userId: uuid('user_id').references(() => users.id),
    guestId: uuid('guest_id').references(() => scopedGuestAccess.id),
    role: text('role').$type<'VIEWER' | 'COLLABORATOR'>().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: time(),
  },
  (t) => [
    check('presentation_grant_actor', sql`(${t.userId} IS NOT NULL) <> (${t.guestId} IS NOT NULL)`),
    check('presentation_grant_role', sql`${t.role} IN ('VIEWER','COLLABORATOR')`),
    uniqueIndex('presentation_user_grant_unique')
      .on(t.presentationId, t.userId)
      .where(sql`${t.revokedAt} IS NULL`),
    uniqueIndex('presentation_guest_grant_unique')
      .on(t.presentationId, t.guestId)
      .where(sql`${t.revokedAt} IS NULL`),
  ],
);
export const presentationInvitations = pgTable(
  'presentation_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id),
    email: text('email').notNull(),
    role: text('role').$type<'VIEWER' | 'COLLABORATOR'>().notNull(),
    state: text('state')
      .$type<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED'>()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedUserId: uuid('accepted_user_id').references(() => users.id),
    grantId: uuid('grant_id').references(() => presentationGrants.id),
    createdAt: time(),
  },
  (t) => [
    check(
      'presentation_invite_state',
      sql`${t.state} IN ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED')`,
    ),
    check('presentation_invite_role', sql`${t.role} IN ('VIEWER','COLLABORATOR')`),
  ],
);
export const presentationScreens = pgTable(
  'presentation_screens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id),
    kind: text('kind').$type<'MAIN_ARCHITECTURE' | 'AUTHORED'>().notNull(),
    draft: jsonb('draft').$type<Draft>().notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    state: text('state').$type<'DRAFT' | 'CONFIRMED'>().notNull(),
    lastDefinitionId: uuid('last_definition_id'),
    sortOrder: integer('sort_order').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: time(),
  },
  (t) => [
    uniqueIndex('presentation_base_unique')
      .on(t.presentationId)
      .where(sql`${t.kind}='MAIN_ARCHITECTURE'`),
    uniqueIndex('presentation_screen_owner_unique').on(t.id, t.presentationId),
    check(
      'presentation_screen_lifecycle',
      sql`${t.kind} IN ('MAIN_ARCHITECTURE','AUTHORED') AND ${t.state} IN ('DRAFT','CONFIRMED') AND ${t.changeStamp}>=0`,
    ),
  ],
);
export const screenDefinitions = pgTable(
  'presentation_screen_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    screenId: uuid('screen_id')
      .notNull()
      .references(() => presentationScreens.id),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id),
    draftStamp: integer('draft_stamp').notNull(),
    definition: jsonb('definition')
      .$type<{ draft: Draft; overlays: Overlay[]; inclusions: Inclusion[] }>()
      .notNull(),
    createdAt: time(),
  },
  (t) => [
    uniqueIndex('presentation_definition_owner_unique').on(t.id, t.screenId),
    foreignKey({
      columns: [t.screenId, t.presentationId],
      foreignColumns: [presentationScreens.id, presentationScreens.presentationId],
      name: 'definition_screen_family_fk',
    }),
  ],
);
export type Overlay = {
  id: string;
  sourceNodeId: string;
  destinationNodeId: string;
  label: string;
  visual: import('zod').infer<typeof import('./presentation.input.js').edgeVisual>;
};
export const scenarioOverlays = pgTable('scenario_overlay_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  screenId: uuid('screen_id')
    .notNull()
    .references(() => presentationScreens.id),
  payload: jsonb('payload').$type<Omit<Overlay, 'id'>>().notNull(),
});
export const screenKnowledge = pgTable(
  'presentation_screen_knowledge_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    screenId: uuid('screen_id')
      .notNull()
      .references(() => presentationScreens.id),
    kind: text('kind').$type<Inclusion['kind']>().notNull(),
    originId: uuid('origin_id').notNull(),
    originStamp: integer('origin_stamp'),
    includedByUserId: uuid('included_by_user_id')
      .notNull()
      .references(() => users.id),
    representation: jsonb('representation').$type<Record<string, unknown>>().notNull(),
    createdAt: time(),
  },
  (t) => [
    check(
      'presentation_inclusion_kind',
      sql`${t.kind} IN ('KNOWLEDGE','SNAPSHOT','SOURCE_REFERENCE')`,
    ),
  ],
);
