import { z } from 'zod';
import { sourceTypes } from '../../shared/database/schema.js';
import { name, uuid } from '../../shared/validation/common.js';
export const sourceInput = z
  .object({
    sourceType: z.enum(sourceTypes),
    name,
    uploadId: uuid.optional(),
    externalReference: z.string().url().max(2000).nullable().default(null),
    note: z.string().max(2000).nullable().default(null),
  })
  .strict()
  .refine((v) => v.sourceType !== 'MIRO' || (v.externalReference !== null && !v.uploadId), {
    message: 'Miro requires a reference, not an upload',
  });
export const sourceParams = z.object({ projectId: uuid, sourceId: uuid });
export const uploadParams = z.object({ uploadId: uuid });
