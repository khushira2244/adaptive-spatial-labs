import { z } from 'zod';
import { projectTypes, visibilities } from '../../shared/database/schema.js';
import { name, uuid, pageQuery } from '../../shared/validation/common.js';
import { structureInput } from '../project-structure/structure.schema.js';
import { sourceInput } from '../project-sources/source.schema.js';
export const createProjectSchema = z
  .object({
    name,
    description: z.string().trim().max(5000).default(''),
    organizationId: uuid,
    projectType: z.enum(projectTypes),
    visibility: z.enum(visibilities),
    structure: structureInput,
    editorUserIds: z
      .array(uuid)
      .max(100)
      .default([])
      .refine((v) => new Set(v).size === v.length),
    sources: z.array(sourceInput).max(20).default([]),
  })
  .strict();
export const projectPatch = z
  .object({
    name: name.optional(),
    description: z.string().trim().max(5000).optional(),
    projectType: z.enum(projectTypes).optional(),
    visibility: z.enum(visibilities).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const projectQuery = pageQuery.extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});
