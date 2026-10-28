import 'dotenv/config';
import { z } from 'zod';
const ttl = z.coerce.number().int().positive();
const configSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => /^postgres(ql)?:/.test(v)),
    ACCESS_TOKEN_SECRET: z.string().min(32),
    REFRESH_TOKEN_SECRET: z.string().min(32),
    ACCESS_TOKEN_TTL: ttl.max(3600).default(900),
    REFRESH_TOKEN_TTL: ttl.max(2592000).default(604800),
    LOCAL_STORAGE_PATH: z.string().min(1).default('./storage'),
    MAX_UPLOAD_BYTES: ttl.max(52428800).default(10485760),
  })
  .refine(
    (v) =>
      v.NODE_ENV !== 'production' ||
      ![v.ACCESS_TOKEN_SECRET, v.REFRESH_TOKEN_SECRET].some((secret) =>
        /^(REPLACE_WITH_|CHANGE_ME)/.test(secret),
      ),
    { message: 'Production token secrets must not be example placeholders' },
  )
  .refine((v) => v.ACCESS_TOKEN_SECRET !== v.REFRESH_TOKEN_SECRET, {
    message: 'Token secrets must be distinct',
  });
export type Config = z.infer<typeof configSchema>;
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success)
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  return result.data;
}
