import { z } from 'zod';
import { projectTypes } from '../../shared/database/schema.js';
import { layerList } from '../project-layers/layer.schema.js';
export const structureInput = z
  .object({ templateKey: z.enum(projectTypes), layers: layerList.optional() })
  .strict();
