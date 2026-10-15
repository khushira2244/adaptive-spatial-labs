import { z } from 'zod';
import { designations } from '../../shared/database/schema.js';
import { name } from '../../shared/validation/common.js';
export const signupSchema = z
  .object({
    fullName: name,
    workEmail: z.string().trim().email().max(254),
    password: z.string().min(12).max(128),
    designation: z.enum(designations),
    teamDepartment: z.string().trim().max(200).nullable().default(null),
    organizationName: name,
  })
  .strict();
export const loginSchema = z
  .object({ workEmail: z.string().trim().email().max(254), password: z.string().min(1).max(128) })
  .strict();
export const refreshSchema = z.object({ refreshToken: z.string().min(40).max(200) }).strict();
