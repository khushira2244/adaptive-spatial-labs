import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema } from '../../shared/concurrency/change-stamp.js';

const text = z.string().trim().min(1).max(200);
export const sourceLocatorSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('MIRO'),
      boardId: text,
      frameId: text.optional(),
      itemId: text.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('DOCUMENT'),
      section: text.optional(),
      page: z.number().int().positive().max(100000).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('OPENAPI'),
      path: text.optional(),
      operation: z
        .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'])
        .optional(),
      component: text.optional(),
    })
    .strict(),
  z.object({ kind: z.literal('ARTIFACT'), fragment: text.optional() }).strict(),
]);
export type SourceLocator = z.infer<typeof sourceLocatorSchema>;
export const provenanceParams = z.object({ projectId: uuid, sourceId: uuid }).strict();
export const referenceParams = provenanceParams.extend({ referenceId: uuid });
export const ingestionParams = provenanceParams.extend({ runId: uuid });
export const referenceInput = z
  .object({ operationId: uuid, revision: text, locator: sourceLocatorSchema })
  .strict();
export const ingestionInput = z
  .object({
    operationId: uuid,
    revision: text,
    inputReferenceIds: z.array(uuid).max(200).default([]),
    retryOf: uuid.optional(),
  })
  .strict();
export const ingestionTransition = z.discriminatedUnion('action', [
  z
    .object({ operationId: uuid, expectedStamp: changeStampSchema, action: z.literal('START') })
    .strict(),
  z
    .object({
      operationId: uuid,
      expectedStamp: changeStampSchema,
      action: z.literal('SUCCEED'),
      outputReferenceIds: z.array(uuid).max(200).default([]),
    })
    .strict(),
  z
    .object({
      operationId: uuid,
      expectedStamp: changeStampSchema,
      action: z.literal('FAIL'),
      failureCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    })
    .strict(),
  z
    .object({ operationId: uuid, expectedStamp: changeStampSchema, action: z.literal('CANCEL') })
    .strict(),
]);
export type ReferenceInput = z.infer<typeof referenceInput>;
export type IngestionInput = z.infer<typeof ingestionInput>;
export type IngestionTransition = z.infer<typeof ingestionTransition>;
