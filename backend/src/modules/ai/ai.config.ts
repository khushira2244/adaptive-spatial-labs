import { z } from 'zod';
const schema = z.object({
  AI_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),
  GOOGLE_CLOUD_PROJECT: z
    .string()
    .regex(/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/)
    .optional(),
  GOOGLE_CLOUD_LOCATION: z
    .string()
    .regex(/^[a-z0-9-]{1,60}$/)
    .default('global'),
  GEMINI_MODEL_PRIMARY: z
    .string()
    .regex(/^gemini-[a-z0-9.-]{1,90}$/)
    .default('gemini-3.5-flash'),
  GEMINI_MODEL_REASONING: z
    .string()
    .regex(/^gemini-[a-z0-9.-]{1,90}$/)
    .default('gemini-3.1-pro-preview'),
  AI_TIMEOUT_MS: z.coerce.number().int().min(100).max(60000).default(20000),
});
export type AIConfig = z.infer<typeof schema>;
/** AI misconfiguration is non-fatal to the deterministic application. */
export function readAIConfig(env: NodeJS.ProcessEnv = process.env): AIConfig | null {
  const result = schema.safeParse(env);
  return result.success ? result.data : null;
}
