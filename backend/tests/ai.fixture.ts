import type {
  AIProvider,
  ProviderRequest,
  ProviderResponse,
} from '../src/modules/ai/providers/ai-provider.js';
export class FakeAIProvider implements AIProvider {
  calls: ProviderRequest[] = [];
  output: unknown = {
    answer: 'Grounded answer',
    references: [],
    assumptions: [],
    uncertainties: [],
    followUps: [],
  };
  raw: string | undefined;
  failure: Error | undefined;
  before: ((request: ProviderRequest) => Promise<void>) | undefined;
  async generateStructured(request: ProviderRequest): Promise<ProviderResponse> {
    this.calls.push(request);
    await this.before?.(request);
    if (this.failure) throw this.failure;
    return {
      text: this.raw ?? JSON.stringify(this.output),
      metadata: { provider: 'fake', model: 'test', latencyMs: 1 },
    };
  }
  generateText(request: ProviderRequest) {
    return this.generateStructured(request);
  }
  reset() {
    this.calls = [];
    this.raw = undefined;
    this.failure = undefined;
    this.before = undefined;
    this.output = {
      answer: 'Grounded answer',
      references: [],
      assumptions: [],
      uncertainties: [],
      followUps: [],
    };
  }
}
export const nodeVisual = {
  state: 'NORMAL' as const,
  emphasis: 'NORMAL' as const,
  scale: 1,
  depth: 'NORMAL' as const,
  opacity: 1,
  color: 'DEFAULT' as const,
  marker: 'NONE' as const,
  visible: true,
  label: '',
  pulse: false,
};
export const edgeVisual = {
  state: 'NORMAL' as const,
  style: 'SOLID' as const,
  emphasis: 'NORMAL' as const,
  marker: 'NONE' as const,
  visible: true,
  activity: 'STATIC' as const,
  color: 'DEFAULT' as const,
  label: '',
};
