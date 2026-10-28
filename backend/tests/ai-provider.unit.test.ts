import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { readAIConfig } from '../src/modules/ai/ai.config.js';
import {
  VertexGeminiProvider,
  type GeminiClient,
} from '../src/modules/ai/providers/vertex-gemini.provider.js';
import type { ProviderRequest } from '../src/modules/ai/providers/ai-provider.js';
import { AIExecutor, type AITelemetry } from '../src/modules/ai/orchestration/ai.executor.js';
import { AIError } from '../src/modules/ai/ai.error.js';
import { outputs } from '../src/modules/ai/schemas/ai.output.js';
import {
  architecturePackage,
  boundPackage,
} from '../src/modules/ai/capabilities/context-package.js';
import { validateReferences } from '../src/modules/ai/capabilities/ai.semantic.js';
import { FakeAIProvider } from './ai.fixture.js';
import { proposal, op } from './step2.fixture.js';
const config = () =>
  readAIConfig({ GOOGLE_CLOUD_PROJECT: 'test-project', GOOGLE_CLOUD_LOCATION: 'global' })!;
const req = (): ProviderRequest => ({
  system: 'role',
  prompt: 'bounded data',
  jsonSchema: { type: 'object' },
  signal: new AbortController().signal,
  reasoning: false,
  maxOutputTokens: 128,
});
describe('Official Gemini provider and bounded execution', () => {
  it('maps Vertex structured request, explicit model, timeout, no recursive continuation', async () => {
    let captured: Parameters<GeminiClient['models']['generateContent']>[0] | undefined;
    const client: GeminiClient = {
      models: {
        generateContent: async (p) => {
          captured = p;
          return {
            text: '{"ok":true}',
            responseId: 'safe-id',
            usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 2 },
          } as Awaited<ReturnType<GeminiClient['models']['generateContent']>>;
        },
      },
    };
    const out = await new VertexGeminiProvider(config(), client).generateStructured(req());
    expect(captured).toMatchObject({
      model: 'gemini-3.5-flash',
      contents: 'bounded data',
      config: {
        temperature: 0,
        maxOutputTokens: 128,
        responseMimeType: 'application/json',
        automaticContinuation: false,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    expect(out.metadata).toMatchObject({
      provider: 'vertex-gemini',
      model: 'gemini-3.5-flash',
      requestId: 'safe-id',
      inputTokens: 3,
      outputTokens: 2,
    });
    expect(out).not.toHaveProperty('credentials');
  });
  it('reasoning is explicit and configurable, never automatic escalation', async () => {
    let model = '';
    const c: GeminiClient = {
      models: {
        generateContent: async (p) => {
          model = p.model;
          return { text: 'ok' } as Awaited<ReturnType<GeminiClient['models']['generateContent']>>;
        },
      },
    };
    await new VertexGeminiProvider(config(), c).generateText({ ...req(), reasoning: true });
    expect(model).toBe('gemini-3.1-pro-preview');
  });
  it('unconfigured provider is typed unavailable and does not initialize SDK credentials', async () => {
    await expect(
      new VertexGeminiProvider(readAIConfig({})!).generateStructured(req()),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  it('disabled or invalid config cannot break deterministic startup', () => {
    expect(readAIConfig({ AI_ENABLED: 'false' })?.AI_ENABLED).toBe(false);
    expect(readAIConfig({ AI_TIMEOUT_MS: 'invalid' })).toBeNull();
  });
  it('SDK provider failures redact raw credential/body messages', async () => {
    const c: GeminiClient = {
      models: {
        generateContent: async () => {
          throw new Error('SECRET_ADC_TOKEN private body');
        },
      },
    };
    try {
      await new VertexGeminiProvider(config(), c).generateStructured(req());
      throw new Error('expected');
    } catch (e) {
      expect(e).toMatchObject({ code: 'AI_PROVIDER_ERROR' });
      expect(String(e)).not.toContain('SECRET');
    }
  });
  it('blocked/empty/truncated response fails closed', async () => {
    const c: GeminiClient = {
      models: {
        generateContent: async () =>
          ({ text: '{}', candidates: [{ finishReason: 'MAX_TOKENS' }] }) as Awaited<
            ReturnType<GeminiClient['models']['generateContent']>
          >,
      },
    };
    await expect(
      new VertexGeminiProvider(config(), c).generateStructured(req()),
    ).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID' });
  });
  it('cancellation reaches adapter before SDK call', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(
      new VertexGeminiProvider(config()).generateStructured({ ...req(), signal: abort.signal }),
    ).rejects.toMatchObject({ code: 'AI_CANCELLED' });
  });
  it('executor handles unavailable provider without model call', async () => {
    await expect(
      new AIExecutor(null).run('ask', outputs.ask, 'role', {}, false),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  for (const raw of [
    'not JSON',
    '{}',
    '{"answer":"x","references":[],"assumptions":[],"uncertainties":[],"followUps":[],"extra":true}',
  ]) {
    it('strict schema rejects malformed/overposted output ' + raw.slice(0, 12), async () => {
      const fake = new FakeAIProvider();
      fake.raw = raw;
      await expect(
        new AIExecutor(fake).run('ask', outputs.ask, 'role', {}, false),
      ).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID' });
    });
  }
  it('oversized provider output is rejected', async () => {
    const f = new FakeAIProvider();
    f.raw = 'x'.repeat(32769);
    await expect(
      new AIExecutor(f).run('ask', outputs.ask, 'role', {}, false),
    ).rejects.toMatchObject({ code: 'AI_OUTPUT_INVALID' });
  });
  it('bounds context before any provider execution', async () => {
    const f = new FakeAIProvider();
    await expect(
      new AIExecutor(f).run('ask', outputs.ask, 'role', { large: 'x'.repeat(131073) }, false),
    ).rejects.toMatchObject({ code: 'AI_CONTEXT_TOO_LARGE' });
    expect(f.calls).toHaveLength(0);
  });
  it('timeout aborts request even when provider ignores cancellation', async () => {
    const f = new FakeAIProvider();
    let aborted = false;
    f.before = async (r) => {
      r.signal.addEventListener('abort', () => {
        aborted = true;
      });
      await new Promise(() => {});
    };
    await expect(
      new AIExecutor(f, 15).run('ask', outputs.ask, 'role', {}, false),
    ).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    expect(aborted).toBe(true);
  });
  it('caller cancellation is typed and releases capacity', async () => {
    const f = new FakeAIProvider();
    f.before = async () => {
      await new Promise(() => {});
    };
    const controller = new AbortController(),
      executor = new AIExecutor(f, 200);
    const pending = executor.run('ask', outputs.ask, 'role', {}, false, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'AI_CANCELLED' });
    f.before = undefined;
    expect((await executor.run('ask', outputs.ask, 'role', {}, false)).proposal.answer).toBe(
      'Grounded answer',
    );
  });
  it('transient provider failure is bounded: no hidden retry/fallback loop', async () => {
    const f = new FakeAIProvider();
    f.failure = new AIError('AI_PROVIDER_ERROR');
    await expect(
      new AIExecutor(f).run('ask', outputs.ask, 'role', {}, false),
    ).rejects.toMatchObject({ code: 'AI_PROVIDER_ERROR' });
    expect(f.calls).toHaveLength(1);
  });
  it('safe telemetry includes metadata only, never prompt/response; logger failure nonfatal', async () => {
    const f = new FakeAIProvider(),
      events: AITelemetry[] = [];
    const result = await new AIExecutor(f, 1000, (e) => events.push(e)).run(
      'ask',
      outputs.ask,
      'secret-system',
      { body: 'PRIVATE_PROMPT' },
      false,
    );
    expect(JSON.stringify(events)).not.toContain('PRIVATE_PROMPT');
    expect(JSON.stringify(events)).not.toContain('Grounded answer');
    expect(result.correlationId).toBeTruthy();
    expect(
      (
        await new AIExecutor(f, 1000, () => {
          throw Error('logger');
        }).run('ask', outputs.ask, 'role', {}, false)
      ).proposal.answer,
    ).toBeTruthy();
  });
  it('rejects ungrounded semantic/evidence reference', () => {
    const p = { payload: {}, references: ['allowed'], nodeIds: [], connectionIds: [], basis: {} };
    expect(() => validateReferences({ nested: { references: ['invented'] } }, p)).toThrow(AIError);
  });
  it('lasso PRIMARY/BOUNDARY and explicit expansion never include inner graph content', () => {
    const f = proposal(op()),
      g = f.graphs[0]!,
      one = g.nodes[0]!,
      two = g.nodes[1]!,
      edge = g.connections[0]!;
    const scope = {
      format: 1 as const,
      kind: 'LASSO_GROUP' as const,
      architectureId: op(),
      architectureGraphRef: g.id,
      architectureStamp: 1,
      selectedNodeRefs: [one.id],
      internalConnectionRefs: [],
      boundaryConnectionRefs: [edge.id],
      externalBoundaryEndpointRefs: [two.id],
    };
    const p = architecturePackage(f, scope);
    expect(p.payload.PRIMARY).toMatchObject({ nodes: [{ id: one.id }], connections: [] });
    expect(p.payload.BOUNDARY).toMatchObject({ endpoints: [{ id: two.id }] });
    expect(JSON.stringify(p.payload)).not.toContain('Ledger');
    expect(p.payload.EXPANDED).toEqual([]);
    expect(architecturePackage(f, scope, true).payload.EXPANDED as unknown[]).toHaveLength(1);
  });
  it('oversized context package is typed', () => {
    expect(() =>
      boundPackage({
        payload: { x: 'x'.repeat(131073) },
        references: [],
        nodeIds: [],
        connectionIds: [],
        basis: {},
      }),
    ).toThrow(AIError);
  });
  for (const [name, schema] of Object.entries(outputs)) {
    it(name + ' structured output schema is JSON-schema representable', () => {
      expect(z.toJSONSchema(schema, { unrepresentable: 'any' }).type).toBe('object');
    });
  }
});
