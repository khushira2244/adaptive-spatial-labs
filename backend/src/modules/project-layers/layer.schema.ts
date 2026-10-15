import { z } from 'zod';
import { name, uuid } from '../../shared/validation/common.js';
export const layerInput = z
  .object({
    name,
    description: z.string().trim().max(2000).nullable().default(null),
    sortOrder: z.number().int().min(0).max(1000),
    source: z.enum(['TEMPLATE', 'USER_CREATED']).default('USER_CREATED'),
  })
  .strict();
export const layerList = z
  .array(layerInput)
  .max(100)
  .refine((layers) => new Set(layers.map((l) => l.sortOrder)).size === layers.length, {
    message: 'Layer order values must be unique',
  });
export const layerPatch = layerInput
  .omit({ source: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0);
export const layerParams = z.object({ projectId: uuid, layerId: uuid });
