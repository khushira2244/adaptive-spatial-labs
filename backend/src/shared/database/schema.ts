import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const designations = [
  'SYSTEM_ARCHITECT',
  'SOLUTION_ARCHITECT',
  'BACKEND_ENGINEER',
  'FRONTEND_ENGINEER',
  'FULLSTACK_ENGINEER',
  'STAFF_ENGINEER',
  'PRINCIPAL_ENGINEER',
  'TECHNICAL_LEAD',
  'PRODUCT_MANAGER',
  'BUSINESS_ANALYST',
  'QA_ENGINEER',
  'SRE_DEVOPS',
  'ENGINEERING_MANAGER',
  'DESIGNER',
  'SECURITY_ENGINEER',
  'OTHER',
] as const;
export const projectTypes = [
  'PRODUCT_SYSTEM',
  'BACKEND_PLATFORM',
  'API_CENTERED',
  'EVENT_DRIVEN',
  'FRONTEND_BACKEND',
  'CUSTOM',
] as const;
export const visibilities = [
  'RESTRICTED',
  'ORGANIZATION_DISCOVERABLE',
  'ORGANIZATION_OPEN',
] as const;
export const sourceTypes = [
  'FILE',
  'MIRO',
  'OPENAPI',
  'ARCHITECTURE_DOC',
  'PRODUCT_REQUIREMENT',
  'DIAGRAM',
] as const;
export const sourceStatuses = [
  'PENDING',
  'UPLOADED',
  'CONNECTED',
  'PROCESSING',
  'READY',
  'FAILED',
] as const;
export const designation = pgEnum('designation', designations);
export const projectType = pgEnum('project_type', projectTypes);
export const visibility = pgEnum('project_visibility', visibilities);
export const projectStatus = pgEnum('project_status', ['ACTIVE', 'ARCHIVED']);
export const memberRole = pgEnum('membership_role', ['OWNER', 'MEMBER']);
export const layerSource = pgEnum('layer_source', ['TEMPLATE', 'USER_CREATED']);
export const sourceType = pgEnum('source_type', sourceTypes);
export const sourceStatus = pgEnum('source_status', sourceStatuses);
const times = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
const id = () => uuid('id').defaultRandom().primaryKey();

export const users = pgTable(
  'users',
  {
    id: id(),
    fullName: text('full_name').notNull(),
    workEmail: text('work_email').notNull(),
    normalizedEmail: text('normalized_email').notNull(),
    passwordHash: text('password_hash').notNull(),
    designation: designation('designation').notNull(),
    teamDepartment: text('team_department'),
    profileImage: text('profile_image'),
    ...times(),
  },
  (t) => [uniqueIndex('users_normalized_email_unique').on(t.normalizedEmail)],
);
export const organizations = pgTable('organizations', {
  id: id(),
  name: text('name').notNull(),
  ...times(),
});
export const organizationMembers = pgTable(
  'organization_members',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    membershipRole: memberRole('membership_role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.organizationId, t.userId] }),
    index('membership_user_idx').on(t.userId),
  ],
);
export const projects = pgTable(
  'projects',
  {
    id: id(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    projectType: projectType('project_type').notNull(),
    visibility: visibility('visibility').notNull(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: projectStatus('status').default('ACTIVE').notNull(),
    ...times(),
  },
  (t) => [
    index('projects_org_idx').on(t.organizationId),
    index('projects_owner_idx').on(t.ownerUserId),
  ],
);
export const projectEditors = pgTable(
  'project_editors',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    addedByUserId: uuid('added_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] }), index('editors_user_idx').on(t.userId)],
);
export const projectStructures = pgTable(
  'project_structures',
  {
    id: id(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    templateKey: projectType('template_key').notNull(),
    ...times(),
  },
  (t) => [uniqueIndex('structure_project_unique').on(t.projectId)],
);
export const projectLayers = pgTable(
  'project_layers',
  {
    id: id(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull(),
    source: layerSource('source').notNull(),
    ...times(),
  },
  (t) => [
    index('layers_project_order_idx').on(t.projectId, t.sortOrder),
    check('layer_order_nonnegative', sql`${t.sortOrder} >= 0`),
  ],
);
export const stagedUploads = pgTable(
  'staged_uploads',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    storageKey: text('storage_key').notNull(),
    name: text('name').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('upload_storage_unique').on(t.storageKey),
    index('uploads_expiry_idx').on(t.expiresAt),
  ],
);
export const projectSources = pgTable(
  'project_sources',
  {
    id: id(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),
    sourceType: sourceType('source_type').notNull(),
    name: text('name').notNull(),
    status: sourceStatus('status').notNull(),
    storageKey: text('storage_key'),
    externalReference: text('external_reference'),
    metadata: jsonb('metadata').$type<SourceMetadata>(),
    addedByUserId: uuid('added_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    ...times(),
  },
  (t) => [
    index('sources_project_idx').on(t.projectId),
    uniqueIndex('source_storage_unique').on(t.storageKey),
  ],
);
export type SourceMetadata = {
  contentType: string | null;
  byteSize: number | null;
  note: string | null;
};
export type Preferences = {
  theme: 'SYSTEM' | 'LIGHT' | 'DARK';
  reduceMotion: boolean;
  notifications: { enabled: boolean; email: boolean };
  mrPreferences: { comfortMode: boolean };
  interactionPreferences: { dominantHand: 'LEFT' | 'RIGHT' };
};
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'restrict' }),
  preferences: jsonb('preferences').$type<Preferences>().notNull(),
  ...times(),
});
export const refreshSessions = pgTable(
  'refresh_sessions',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...times(),
  },
  (t) => [
    uniqueIndex('refresh_hash_unique').on(t.tokenHash),
    index('refresh_user_idx').on(t.userId),
  ],
);
