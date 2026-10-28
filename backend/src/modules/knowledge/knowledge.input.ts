import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema } from '../../shared/concurrency/change-stamp.js';
const refs = z
  .array(uuid)
  .max(256)
  .refine((a) => new Set(a).size === a.length, 'Duplicate reference');
const anchor = {
  format: z.literal(1),
  architectureId: uuid,
  architectureGraphRef: uuid,
  architectureStamp: changeStampSchema,
};
export const semanticScopeSchema = z.discriminatedUnion('kind', [
  z.object({ ...anchor, kind: z.literal('WHOLE_ARCHITECTURE') }).strict(),
  z.object({ ...anchor, kind: z.literal('NODE'), nodeRef: uuid }).strict(),
  z.object({ ...anchor, kind: z.literal('CONNECTION'), connectionRef: uuid }).strict(),
  z
    .object({
      ...anchor,
      kind: z.literal('INNER_ARCHITECTURE'),
      parentNodeRef: uuid,
      innerLinkRef: uuid,
    })
    .strict(),
  z
    .object({
      ...anchor,
      kind: z.literal('LASSO_GROUP'),
      selectedNodeRefs: refs.refine((a) => a.length > 0),
      internalConnectionRefs: refs,
      boundaryConnectionRefs: refs,
      externalBoundaryEndpointRefs: refs,
    })
    .strict(),
]);
export type SemanticScope = z.infer<typeof semanticScopeSchema>;
export const attachmentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ARCHITECTURE'), scope: semanticScopeSchema }).strict(),
  z.object({ kind: z.literal('SOURCE_REFERENCE'), sourceReferenceId: uuid }).strict(),
  z.object({ kind: z.literal('SNAPSHOT'), snapshotId: uuid }).strict(),
]);
export type Attachment = z.infer<typeof attachmentSchema>;
export const categories = ['NOTE', 'QUESTION', 'DISCUSSION_POINT'] as const;
const content = {
  category: z.enum(categories),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(16000),
  state: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  attachments: z.array(attachmentSchema).max(16).default([]),
};
export const createKnowledgeInput = z
  .object({ operationId: uuid, projectId: uuid.optional(), meetingId: uuid.optional(), ...content })
  .strict();
export const updateKnowledgeInput = z
  .object({ expectedStamp: changeStampSchema, ...content })
  .strict();
export const snapshotPayloadSchema = z
  .object({
    format: z.literal(1),
    title: z.string().trim().min(1).max(200),
    caption: z.string().trim().max(4000).default(''),
  })
  .strict();
export const createSnapshotInput = z
  .object({
    operationId: uuid,
    projectId: uuid.optional(),
    meetingId: uuid.optional(),
    scope: semanticScopeSchema,
    payload: snapshotPayloadSchema,
  })
  .strict();
export const resourceParams = z.object({ id: uuid }).strict();
export const privateQuery = z
  .object({
    projectId: uuid.optional(),
    meetingId: uuid.optional(),
    category: z.enum(categories).optional(),
    graphId: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();
export type PrivateQuery = z.infer<typeof privateQuery>;
export type CreateKnowledgeInput = z.infer<typeof createKnowledgeInput>;
export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeInput>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotInput>;
