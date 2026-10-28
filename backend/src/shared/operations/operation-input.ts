import { z } from 'zod';
import { uuidIdentitySchema } from '../validation/uuid-identity.js';

const kind = z.string().regex(/^[a-z][a-z0-9_.-]{0,95}$/);
export const operationInputSchema = z
  .object({
    id: uuidIdentitySchema,
    commandKind: kind,
    scope: z.object({ kind, id: uuidIdentitySchema }).strict().optional(),
  })
  .strict();
export type OperationInput = z.infer<typeof operationInputSchema>;

// Deliberately narrow durable receipt; private result bodies must be projected by their own domain.
// UUID reference is a durable resource/receipt identity, not an authorization token.
export const operationResultSchema = z
  .object({
    reference: z.object({ kind, id: uuidIdentitySchema }).strict(),
    status: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
    changeStamp: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  })
  .strict();
export type OperationResult = z.infer<typeof operationResultSchema>;
