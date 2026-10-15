import { z } from 'zod';
import { designations } from '../../shared/database/schema.js';
import { name } from '../../shared/validation/common.js';
export const profileSchema = z
  .object({
    fullName: name.optional(),
    designation: z.enum(designations).optional(),
    teamDepartment: z.string().trim().max(200).nullable().optional(),
    profileImage: z.string().url().max(2000).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
