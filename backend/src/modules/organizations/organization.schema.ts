import { z } from 'zod';
import { name, pageQuery, uuid } from '../../shared/validation/common.js';
export const organizationSchema = z.object({ name }).strict();
export const organizationParams = z.object({ organizationId: uuid });
export const memberQuery = pageQuery.extend({ search: z.string().trim().max(100).default('') });
