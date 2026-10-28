import 'dotenv/config';
import { VertexGeminiProvider } from '../src/modules/ai/providers/vertex-gemini.provider.js';
import { readAIConfig } from '../src/modules/ai/ai.config.js';
import { AIError } from '../src/modules/ai/ai.error.js';
if (!process.argv.includes('--live')) {
  console.error('Opt-in only: npx tsx scripts/ai-smoke.ts --live');
  process.exit(2);
}
const config = readAIConfig();
try {
  if (!config?.GOOGLE_CLOUD_PROJECT) throw new AIError('AI_UNAVAILABLE');
  const out = await new VertexGeminiProvider(config).generateStructured({
    system: 'Return only requested JSON.',
    prompt: 'Return {"ok":true}.',
    jsonSchema: {
      type: 'object',
      properties: { ok: { type: 'boolean' } },
      required: ['ok'],
      additionalProperties: false,
    },
    signal: AbortSignal.timeout(config.AI_TIMEOUT_MS),
    reasoning: false,
    maxOutputTokens: 128,
  });
  let valid = false;
  try {
    valid = JSON.parse(out.text).ok === true;
  } catch {}
  console.log(JSON.stringify({ status: valid ? 'PASS' : 'AI_OUTPUT_INVALID', ...out.metadata }));
  if (!valid) process.exitCode = 1;
} catch (error) {
  console.log(
    JSON.stringify({ status: error instanceof AIError ? error.code : 'AI_PROVIDER_ERROR' }),
  );
  process.exitCode = 1;
}
