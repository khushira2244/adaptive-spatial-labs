import {
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from '@google/genai';
import type { AIConfig } from '../ai.config.js';
import { AIError } from '../ai.error.js';
import type { AIProvider, ProviderRequest, ProviderResponse } from './ai-provider.js';
export type GeminiClient = {
  models: {
    generateContent: (params: GenerateContentParameters) => Promise<GenerateContentResponse>;
  };
};
export class VertexGeminiProvider implements AIProvider {
  private client: GeminiClient | undefined;
  constructor(
    private config: AIConfig,
    private supplied?: GeminiClient,
  ) {}
  generateStructured(request: ProviderRequest) {
    return this.generate(request, true);
  }
  generateText(request: ProviderRequest) {
    return this.generate(request, false);
  }
  private async generate(r: ProviderRequest, structured: boolean): Promise<ProviderResponse> {
    if (r.signal.aborted) throw new AIError('AI_CANCELLED');
    if (!this.config.AI_ENABLED || !this.config.GOOGLE_CLOUD_PROJECT)
      throw new AIError('AI_UNAVAILABLE');
    const model = r.reasoning
      ? this.config.GEMINI_MODEL_REASONING
      : this.config.GEMINI_MODEL_PRIMARY;
    const started = Date.now();
    try {
      this.client ??=
        this.supplied ??
        new GoogleGenAI({
          vertexai: true,
          project: this.config.GOOGLE_CLOUD_PROJECT,
          location: this.config.GOOGLE_CLOUD_LOCATION,
          httpOptions: { timeout: this.config.AI_TIMEOUT_MS, retryOptions: { attempts: 1 } },
        });
      const out = await this.client.models.generateContent({
        model,
        contents: r.prompt,
        config: {
          systemInstruction: r.system,
          abortSignal: r.signal,
          maxOutputTokens: r.maxOutputTokens,
          temperature: 0,
          automaticContinuation: false,
          ...(!r.reasoning ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          ...(structured
            ? { responseMimeType: 'application/json', responseJsonSchema: r.jsonSchema }
            : {}),
        },
      });
      const text = out.text;
      if (!text || out.candidates?.some((c) => c.finishReason && c.finishReason !== 'STOP'))
        throw new AIError('AI_OUTPUT_INVALID');
      const usage = out.usageMetadata,
        validCount = (n: unknown) =>
          typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : undefined;
      return {
        text,
        metadata: {
          provider: 'vertex-gemini',
          model,
          latencyMs: Date.now() - started,
          ...(out.responseId && /^[a-zA-Z0-9_-]{1,150}$/.test(out.responseId)
            ? { requestId: out.responseId }
            : {}),
          inputTokens: validCount(usage?.promptTokenCount),
          outputTokens: validCount(usage?.candidatesTokenCount),
        },
      };
    } catch (e) {
      if (e instanceof AIError) throw e;
      if (r.signal.aborted) throw new AIError('AI_CANCELLED');
      // Never forward SDK messages, bodies, credentials, request headers or prompts.
      const status = e && typeof e === 'object' && 'status' in e ? e.status : undefined;
      if (status === 401 || status === 403) throw new AIError('AI_UNAVAILABLE');
      if (status === 408 || status === 504 || (e instanceof Error && e.name === 'TimeoutError'))
        throw new AIError('AI_TIMEOUT');
      throw new AIError('AI_PROVIDER_ERROR');
    }
  }
}
