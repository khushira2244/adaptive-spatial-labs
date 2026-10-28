export type AIMetadata = {
  provider: string;
  model: string;
  requestId?: string | undefined;
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
  latencyMs: number;
};
export type ProviderRequest = {
  system: string;
  prompt: string;
  jsonSchema?: unknown;
  signal: AbortSignal;
  reasoning: boolean;
  maxOutputTokens: number;
};
export type ProviderResponse = { text: string; metadata: AIMetadata };
export interface AIProvider {
  generateStructured(request: ProviderRequest): Promise<ProviderResponse>;
  generateText(request: ProviderRequest): Promise<ProviderResponse>;
}
