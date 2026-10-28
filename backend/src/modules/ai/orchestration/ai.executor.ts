import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { AIProvider, AIMetadata } from '../providers/ai-provider.js';
import { AIError } from '../ai.error.js';
import type { Capability } from '../schemas/ai.output.js';
const metaSchema = z.object({
  provider: z.string().regex(/^[a-z0-9-]{1,40}$/),
  model: z.string().regex(/^[a-zA-Z0-9./_-]{1,120}$/),
  requestId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,150}$/)
    .optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  latencyMs: z.number().finite().nonnegative(),
});
export type AITelemetry = {
  capability: Capability;
  correlationId: string;
  status: string;
  latencyMs: number;
  provider?: string;
  model?: string;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
};
export class AIExecutor {
  private active = 0;
  constructor(
    private provider: AIProvider | null,
    private timeoutMs = 20000,
    private record: (event: AITelemetry) => void = () => {},
  ) {}
  async run<S extends z.ZodType>(
    capability: Capability,
    schema: S,
    system: string,
    payload: unknown,
    reasoning: boolean,
    signal?: AbortSignal,
  ): Promise<{ proposal: z.output<S>; metadata: AIMetadata; correlationId: string }> {
    const correlationId = randomUUID(),
      start = Date.now();
    if (!this.provider) throw new AIError('AI_UNAVAILABLE');
    if (this.active >= 4) throw new AIError('AI_UNAVAILABLE');
    const prompt = JSON.stringify(payload);
    if (Buffer.byteLength(prompt) > 131072) throw new AIError('AI_CONTEXT_TOO_LARGE');
    if (signal?.aborted) throw new AIError('AI_CANCELLED');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    this.active++;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new AIError('AI_TIMEOUT'));
        }, this.timeoutMs);
      });
      const cancelled = new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          'abort',
          () => reject(new AIError(signal?.aborted ? 'AI_CANCELLED' : 'AI_TIMEOUT')),
          { once: true },
        );
      });
      const json = z.toJSONSchema(schema, { unrepresentable: 'any' });
      delete json.$schema;
      const raw = await Promise.race([
        this.provider.generateStructured({
          system,
          prompt,
          jsonSchema: json,
          signal: controller.signal,
          reasoning,
          maxOutputTokens: 8192,
        }),
        timeout,
        cancelled,
      ]);
      if (Buffer.byteLength(raw.text) > 32768) throw new AIError('AI_OUTPUT_INVALID');
      let proposal: z.output<S>, metadata: AIMetadata;
      try {
        proposal = schema.parse(JSON.parse(raw.text));
        metadata = metaSchema.parse(raw.metadata);
      } catch {
        throw new AIError('AI_OUTPUT_INVALID');
      }
      this.safeRecord({
        capability,
        correlationId,
        status: 'SCHEMA_VALIDATED',
        latencyMs: Date.now() - start,
        provider: metadata.provider,
        model: metadata.model,
        inputTokens: metadata.inputTokens,
        outputTokens: metadata.outputTokens,
      });
      return { proposal, metadata, correlationId };
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError('AI_PROVIDER_ERROR');
      this.safeRecord({
        capability,
        correlationId,
        status: err.code,
        latencyMs: Date.now() - start,
      });
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      this.active--;
    }
  }
  private safeRecord(event: AITelemetry) {
    try {
      this.record(event);
    } catch {
      /* Telemetry never changes a capability result. */
    }
  }
}
