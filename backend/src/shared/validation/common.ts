import { z } from 'zod';
export const uuid = z.string().uuid();
export const name = z.string().trim().min(1).max(200);
export const projectParams = z.object({ projectId: uuid });
export const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export const data = <T>(value: T) => ({ data: value });
