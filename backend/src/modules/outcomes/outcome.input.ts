import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { changeStampSchema as stamp } from '../../shared/concurrency/change-stamp.js';
export const classification = z.enum([
  'RAISED',
  'DISCUSSED',
  'ADDRESSED',
  'UNRESOLVED',
  'DEFERRED',
  'NOT_DISCUSSED',
  'DECISION',
  'ACTION',
]);
export type Classification = z.infer<typeof classification>;
export const title = z.string().trim().min(1).max(200);
const text = z.string().trim().max(4000);
const keys = z
  .array(z.string().min(1).max(150))
  .max(32)
  .refine((a) => new Set(a).size === a.length);
export const createReview = z.object({ operationId: uuid, captureId: uuid }).strict();
const base = { operationId: uuid, expectedStamp: stamp };
const ids = z
  .array(uuid)
  .min(1)
  .max(64)
  .refine((a) => new Set(a).size === a.length);
export const reviewCommand = z.discriminatedUnion('action', [
  z.object({ ...base, action: z.literal('BEGIN') }).strict(),
  z.object({ ...base, action: z.literal('SUMMARY'), summary: text }).strict(),
  z
    .object({ ...base, action: z.literal('ADD_MANUAL'), title, summary: text, evidenceKeys: keys })
    .strict(),
  z
    .object({ ...base, action: z.literal('EDIT_ITEM'), itemId: uuid, title, summary: text })
    .strict(),
  z.object({ ...base, action: z.literal('CLASSIFY'), itemId: uuid, classification }).strict(),
  z.object({ ...base, action: z.literal('RETAIN'), itemId: uuid, retained: z.boolean() }).strict(),
  z.object({ ...base, action: z.literal('EVIDENCE'), itemId: uuid, evidenceKeys: keys }).strict(),
  z
    .object({
      ...base,
      action: z.literal('REORDER'),
      itemIds: z
        .array(uuid)
        .max(2304)
        .refine((a) => new Set(a).size === a.length),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('DECISION'),
      decisionId: uuid.optional(),
      itemIds: ids,
      title,
      statement: z.string().trim().min(1).max(4000),
      rationale: text,
      evidenceKeys: keys,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('ACTION'),
      actionId: uuid.optional(),
      itemIds: ids,
      title,
      description: text,
      assigneeParticipantId: uuid.nullable(),
      dueDate: z.iso.date().nullable(),
      decisionId: uuid.nullable(),
      evidenceKeys: keys,
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('REMOVE_OUTCOME'),
      kind: z.enum(['DECISION', 'ACTION']),
      outcomeId: uuid,
    })
    .strict(),
  z.object({ ...base, action: z.literal('READY'), confirmed: z.literal(true) }).strict(),
  z.object({ ...base, action: z.literal('REOPEN') }).strict(),
  z.object({ ...base, action: z.literal('SAVE'), confirmed: z.literal(true) }).strict(),
]);
export type ReviewCommand = z.infer<typeof reviewCommand>;
export const page = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(6),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();
