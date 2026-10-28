import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema as stamp } from '../../shared/concurrency/change-stamp.js';
import { semanticScopeSchema } from '../knowledge/knowledge.input.js';
export const screenScope = semanticScopeSchema.refine(
  (s) => s.kind === 'WHOLE_ARCHITECTURE' || s.kind === 'LASSO_GROUP',
  'Screen scope must be whole or lasso',
);
const name = z.string().trim().min(1).max(200),
  short = z.string().trim().max(1000);
export const screenTypes = [
  'MAIN_ARCHITECTURE',
  'ARCHITECTURE_OVERVIEW',
  'DISCUSSION',
  'SUCCESS',
  'FAILURE',
  'RECOVERY',
  'CUSTOM',
] as const;
export const nodeVisual = z
  .object({
    state: z.enum(['NORMAL', 'SUCCESS', 'WARNING', 'FAILURE', 'DISABLED']),
    emphasis: z.enum(['NORMAL', 'HIGHLIGHT', 'DIM']),
    scale: z.number().min(0.5).max(2),
    depth: z.enum(['BACK', 'NORMAL', 'FORWARD']),
    opacity: z.number().min(0.2).max(1),
    color: z.enum(['DEFAULT', 'SUCCESS', 'WARNING', 'FAILURE', 'ACCENT']),
    marker: z.enum(['NONE', 'CHECK', 'WARNING', 'CROSS']),
    visible: z.boolean(),
    label: z.string().max(120),
    pulse: z.boolean(),
  })
  .strict();
export const edgeVisual = z
  .object({
    state: z.enum(['NORMAL', 'ACTIVE', 'BLOCKED', 'BROKEN']),
    style: z.enum(['SOLID', 'DASHED']),
    emphasis: z.enum(['NORMAL', 'HIGHLIGHT', 'DIM']),
    marker: z.enum(['NONE', 'CHECK', 'WARNING', 'CROSS']),
    visible: z.boolean(),
    activity: z.enum(['STATIC', 'FLOW']),
    color: z.enum(['DEFAULT', 'SUCCESS', 'WARNING', 'FAILURE', 'ACCENT']),
    label: z.string().max(120),
  })
  .strict();
export const understanding = z
  .object({
    summary: z.string().trim().min(1).max(2000),
    points: z.array(z.string().trim().min(1).max(300)).max(12),
  })
  .strict();
export const draftSchema = z
  .object({
    name,
    type: z.enum(screenTypes),
    scope: screenScope,
    scenarioGoal: short,
    notes: z.string().max(4000),
    understanding,
    understandingAccepted: z.boolean(),
    nodeOverrides: z.array(z.object({ nodeId: uuid, visual: nodeVisual }).strict()).max(256),
    connectionOverrides: z
      .array(z.object({ connectionId: uuid, visual: edgeVisual }).strict())
      .max(512),
  })
  .strict();
export type Draft = z.infer<typeof draftSchema>;
export type Inclusion = {
  id: string;
  kind: 'KNOWLEDGE' | 'SNAPSHOT' | 'SOURCE_REFERENCE';
  representation: Record<string, unknown>;
};
export const createInput = z
  .object({ operationId: uuid, projectId: uuid, name, purpose: name })
  .strict();
export const addScreenInput = z
  .object({
    operationId: uuid,
    expectedStamp: stamp,
    name,
    type: z.enum(screenTypes).exclude(['MAIN_ARCHITECTURE']),
    scope: screenScope,
    scenarioGoal: short,
    notes: z.string().max(4000),
    understanding,
  })
  .strict();
const base = { operationId: uuid, expectedStamp: stamp };
export const screenCommand = z.discriminatedUnion('action', [
  z
    .object({
      ...base,
      action: z.literal('EDIT'),
      name,
      scenarioGoal: short,
      notes: z.string().max(4000),
      understanding,
    })
    .strict(),
  z.object({ ...base, action: z.literal('SCOPE'), scope: screenScope }).strict(),
  z.object({ ...base, action: z.literal('ACCEPT_UNDERSTANDING') }).strict(),
  z
    .object({ ...base, action: z.literal('NODE_VISUAL'), nodeId: uuid, visual: nodeVisual })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('CONNECTION_VISUAL'),
      connectionId: uuid,
      visual: edgeVisual,
    })
    .strict(),
  z.object({ ...base, action: z.literal('RESET_VISUALS') }).strict(),
  z
    .object({
      ...base,
      action: z.literal('ADD_OVERLAY'),
      sourceNodeId: uuid,
      destinationNodeId: uuid,
      label: z.string().max(120),
      visual: edgeVisual,
    })
    .strict(),
  z.object({ ...base, action: z.literal('DELETE_OVERLAY'), overlayId: uuid }).strict(),
  z
    .object({
      ...base,
      action: z.literal('INCLUDE_KNOWLEDGE'),
      itemId: uuid,
      expectedItemStamp: stamp,
      includeBody: z.literal(true),
    })
    .strict(),
  z.object({ ...base, action: z.literal('INCLUDE_SNAPSHOT'), snapshotId: uuid }).strict(),
  z.object({ ...base, action: z.literal('INCLUDE_SOURCE'), sourceReferenceId: uuid }).strict(),
  z.object({ ...base, action: z.literal('REMOVE_INCLUSION'), inclusionId: uuid }).strict(),
  z.object({ ...base, action: z.literal('CONFIRM') }).strict(),
  z.object({ ...base, action: z.literal('DELETE') }).strict(),
]);
export type ScreenCommand = z.infer<typeof screenCommand>;
export const setupCommand = z.discriminatedUnion('action', [
  z.object({ ...base, action: z.literal('SETUP'), name, purpose: name }).strict(),
  z
    .object({ ...base, action: z.literal('ORDER'), screenIds: z.array(uuid).min(1).max(64) })
    .strict(),
  z.object({ ...base, action: z.literal('SELECT'), screenId: uuid }).strict(),
  z.object({ ...base, action: z.literal('REVOKE'), grantId: uuid }).strict(),
]);
export const inviteInput = z
  .object({
    ...base,
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    role: z.enum(['VIEWER', 'COLLABORATOR']),
    expiresInDays: z.number().int().min(1).max(30),
  })
  .strict();
export const invitationCommand = z
  .object({ operationId: uuid, action: z.enum(['ACCEPT', 'DECLINE', 'CANCEL']) })
  .strict();
export const params = z.object({ presentationId: uuid }).strict();
export const screenParams = params.extend({ screenId: uuid });
export const invitationParams = params.extend({ invitationId: uuid });
export const listQuery = z
  .object({
    projectId: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();
