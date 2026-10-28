import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  boolean,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { projects, users } from '../../shared/database/schema.js';
import { meetings, frozenCaptures, meetingParticipants } from '../meetings/meeting.schema.js';
import type { ActorRef } from '../../shared/auth/principal.js';
import type { Classification } from './outcome.input.js';
const created = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updated = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();
export type Manifest = {
  decisionIds: string[];
  actionIds: string[];
  itemIds: string[];
  unresolvedIds: string[];
  deferredIds: string[];
  savedBy: string;
};
export const meetingReviews = pgTable(
  'meeting_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    captureId: uuid('capture_id')
      .notNull()
      .references(() => frozenCaptures.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
    state: text('state')
      .$type<'DRAFT' | 'REVIEWING' | 'READY_TO_SAVE' | 'SAVED'>()
      .notNull()
      .default('DRAFT'),
    summary: text('summary').notNull().default(''),
    changeStamp: integer('change_stamp').notNull().default(0),
    manifest: jsonb('manifest').$type<Manifest>(),
    savedAt: timestamp('saved_at', { withTimezone: true }),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex('one_review_per_meeting').on(t.meetingId),
    uniqueIndex('one_review_per_capture').on(t.captureId),
    check(
      'review_state',
      sql`${t.state} IN ('DRAFT','REVIEWING','READY_TO_SAVE','SAVED') AND ${t.changeStamp}>=0`,
    ),
    check(
      'review_manifest_state',
      sql`(${t.state}='SAVED')=(${t.manifest} IS NOT NULL AND ${t.savedAt} IS NOT NULL)`,
    ),
  ],
);
export const reviewItems = pgTable(
  'meeting_review_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => meetingReviews.id),
    sourceKey: text('source_key').notNull(),
    category: text('category').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    classification: text('classification').$type<Classification>().notNull().default('RAISED'),
    retained: boolean('retained').notNull().default(true),
    sortOrder: integer('sort_order').notNull(),
    evidenceKeys: jsonb('evidence_keys').$type<string[]>().notNull().default([]),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex('review_source_once').on(t.reviewId, t.sourceKey),
    check(
      'review_item_classification',
      sql`${t.classification} IN ('RAISED','DISCUSSED','ADDRESSED','UNRESOLVED','DEFERRED','NOT_DISCUSSED','DECISION','ACTION')`,
    ),
  ],
);
export const decisions = pgTable('decisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  reviewId: uuid('review_id')
    .notNull()
    .references(() => meetingReviews.id),
  meetingId: uuid('meeting_id')
    .notNull()
    .references(() => meetings.id),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  title: text('title').notNull(),
  statement: text('statement').notNull(),
  rationale: text('rationale').notNull(),
  evidenceKeys: jsonb('evidence_keys').$type<string[]>().notNull(),
  acceptedBy: uuid('accepted_by').references(() => users.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: created(),
});
export const actionItems = pgTable(
  'action_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => meetingReviews.id),
    meetingId: uuid('meeting_id')
      .notNull()
      .references(() => meetings.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    assigneeParticipantId: uuid('assignee_participant_id').references(() => meetingParticipants.id),
    assignee: jsonb('assignee').$type<ActorRef>(),
    dueDate: text('due_date'),
    decisionId: uuid('decision_id').references(() => decisions.id),
    status: text('status').$type<'OPEN'>().notNull().default('OPEN'),
    evidenceKeys: jsonb('evidence_keys').$type<string[]>().notNull(),
    acceptedBy: uuid('accepted_by').references(() => users.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [check('action_initial_status', sql`${t.status}='OPEN'`)],
);
export const reviewOutcomeLinks = pgTable(
  'review_outcome_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => meetingReviews.id),
    itemId: uuid('item_id')
      .notNull()
      .references(() => reviewItems.id),
    decisionId: uuid('decision_id').references(() => decisions.id),
    actionId: uuid('action_id').references(() => actionItems.id),
  },
  (t) => [
    check('one_typed_outcome', sql`(${t.decisionId} IS NOT NULL)<>(${t.actionId} IS NOT NULL)`),
    uniqueIndex('review_item_decision_once').on(t.itemId, t.decisionId),
    uniqueIndex('review_item_action_once').on(t.itemId, t.actionId),
  ],
);
