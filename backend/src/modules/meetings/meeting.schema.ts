import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users, projects } from '../../shared/database/schema.js';
import { scopedGuestAccess } from '../../shared/database/foundation-schema.js';
import { presentations } from '../presentations/presentation.schema.js';
import type { Draft, Inclusion } from '../presentations/presentation.input.js';
import type { Overlay } from '../presentations/presentation.schema.js';
import type { SemanticScope } from '../knowledge/knowledge.input.js';
import type { ActorRef } from '../../shared/auth/principal.js';
const time = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
export type CapturedScreen = {
  id: string;
  definitionId: string;
  definition: { draft: Draft; overlays: Overlay[]; inclusions: Inclusion[] };
};
export type StartPayload = { architectureId: string; screens: CapturedScreen[] };
export type Shared = {
  screenId: string;
  focus: SemanticScope;
  presenterParticipantId: string;
  authorityGeneration: number;
};
export const meetings = pgTable(
  'meetings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    startFromScreenId: uuid('start_from_screen_id').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    state: text('state').$type<'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED'>().notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    createdAt: time(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check(
      'meeting_lifecycle',
      sql`${t.state} IN ('DRAFT','SCHEDULED','LIVE','ENDED') AND ${t.changeStamp}>=0`,
    ),
  ],
);
export const meetingParticipants = pgTable(
  'meeting_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    userId: uuid('user_id').references(() => users.id),
    guestId: uuid('guest_id').references(() => scopedGuestAccess.id),
    state: text('state').$type<'ADMITTED' | 'LEFT' | 'REVOKED'>().notNull(),
    connected: boolean('connected').default(false).notNull(),
    connectionEpoch: integer('connection_epoch').default(0).notNull(),
    createdAt: time(),
  },
  (t) => [
    check(
      'participant_actor_exclusive',
      sql`(${t.userId} IS NOT NULL) <> (${t.guestId} IS NOT NULL)`,
    ),
    check('participant_state', sql`${t.state} IN ('ADMITTED','LEFT','REVOKED')`),
    uniqueIndex('meeting_participant_user_unique').on(t.meetingId, t.userId),
    uniqueIndex('meeting_participant_guest_unique').on(t.meetingId, t.guestId),
  ],
);
export const meetingInvitations = pgTable(
  'meeting_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    email: text('email').notNull(),
    state: text('state')
      .$type<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED'>()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedParticipantId: uuid('accepted_participant_id').references(() => meetingParticipants.id),
    createdAt: time(),
  },
  (t) => [
    check(
      'meeting_invitation_state',
      sql`${t.state} IN ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED')`,
    ),
  ],
);
export const meetingSnapshots = pgTable(
  'meeting_presentation_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    payload: jsonb('payload').$type<StartPayload>().notNull(),
    createdAt: time(),
  },
  (t) => [uniqueIndex('meeting_snapshot_once').on(t.meetingId)],
);
export const meetingShared = pgTable('meeting_shared_state', {
  meetingId: uuid('meeting_id')
    .primaryKey()
    .references(() => meetings.id),
  snapshotId: uuid('snapshot_id')
    .notNull()
    .references(() => meetingSnapshots.id),
  state: jsonb('state').$type<Shared>().notNull(),
});
export const participantPrivate = pgTable('participant_private_state', {
  participantId: uuid('participant_id')
    .primaryKey()
    .references(() => meetingParticipants.id),
  checkpoint: jsonb('checkpoint')
    .$type<{ following: boolean; screenId: string; scope?: SemanticScope }>()
    .notNull(),
  changeStamp: integer('change_stamp').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const presenterTransfers = pgTable(
  'presenter_transfer_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    requesterParticipantId: uuid('requester_participant_id')
      .notNull()
      .references(() => meetingParticipants.id),
    targetParticipantId: uuid('target_participant_id')
      .notNull()
      .references(() => meetingParticipants.id),
    authorityGeneration: integer('authority_generation').notNull(),
    state: text('state').$type<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'>().notNull(),
    createdAt: time(),
  },
  (t) => [
    uniqueIndex('meeting_one_pending_transfer')
      .on(t.meetingId)
      .where(sql`${t.state}='PENDING'`),
    check('transfer_state', sql`${t.state} IN ('PENDING','ACCEPTED','DECLINED','CANCELLED')`),
  ],
);
export type PublicationBody = {
  category: string;
  content: Record<string, unknown>;
  scope: SemanticScope;
  author: ActorRef;
};
export const sharedMeetingItems = pgTable(
  'shared_meeting_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    authorParticipantId: uuid('author_participant_id')
      .notNull()
      .references(() => meetingParticipants.id),
    category: text('category').notNull(),
    currentRevisionId: uuid('current_revision_id'),
    visible: boolean('visible').default(true).notNull(),
    changeStamp: integer('change_stamp').default(0).notNull(),
    createdAt: time(),
  },
  (t) => [
    check(
      'publication_category',
      sql`${t.category} IN ('NOTE','QUESTION','DISCUSSION_POINT','ACTION_SUGGESTION','SNAPSHOT')`,
    ),
  ],
);
export const publicationRevisions = pgTable(
  'shared_meeting_item_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    publicationId: uuid('publication_id')
      .notNull()
      .references(() => sharedMeetingItems.id),
    sequence: integer('sequence').notNull(),
    body: jsonb('body').$type<PublicationBody>().notNull(),
    originKind: text('origin_kind').notNull(),
    originId: uuid('origin_id').notNull(),
    originStamp: integer('origin_stamp'),
    createdAt: time(),
  },
  (t) => [uniqueIndex('publication_revision_sequence').on(t.publicationId, t.sequence)],
);
export type FrozenPayload = {
  snapshotId: string;
  publications: { publicationId: string; revisionId: string }[];
  shared: Shared;
  participants: { id: string; actor: ActorRef }[];
};
export const frozenCaptures = pgTable(
  'frozen_meeting_captures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    payload: jsonb('payload').$type<FrozenPayload>().notNull(),
    createdAt: time(),
  },
  (t) => [uniqueIndex('meeting_frozen_once').on(t.meetingId)],
);
