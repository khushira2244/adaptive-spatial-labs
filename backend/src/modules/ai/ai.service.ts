import { createHash } from 'node:crypto';
import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { transition } from '../outcomes/outcome.validation.js';
import { outputs, type Capability } from './schemas/ai.output.js';
import type { askInput, discussionInput, scenarioInput, visualInput } from './schemas/ai.input.js';
import { AIContextResolver } from './capabilities/context-resolver.js';
import { boundPackage, type ContextPackage } from './capabilities/context-package.js';
import { validateReferences } from './capabilities/ai.semantic.js';
import { validateVisualPreview } from './capabilities/visual-preview.js';
import { AIExecutor } from './orchestration/ai.executor.js';
import { prompts } from './prompts/index.js';
import { AIError } from './ai.error.js';
const fingerprint = (p: ContextPackage) =>
  createHash('sha256').update(JSON.stringify(p)).digest('hex');
export class AIService {
  constructor(
    private db: Database,
    private context: AIContextResolver,
    private executor: AIExecutor,
  ) {}
  private async execute<C extends Capability>(
    principal: Principal,
    capability: C,
    p: ContextPackage,
    intent: unknown,
    reasoning: boolean,
    recheck: () => Promise<ContextPackage>,
    signal?: AbortSignal,
  ) {
    boundPackage(p);
    const result = await this.executor.run(
      capability,
      outputs[capability],
      prompts[capability],
      { intent, context: p.payload },
      reasoning,
      signal,
    );
    const fresh = await recheck();
    await new PrincipalResolver(this.db).requireActive(principal);
    if (fingerprint(fresh) !== fingerprint(p))
      throw new AppError('STALE_CHANGE_STAMP', 'AI context changed. Request a fresh preview.');
    validateReferences(result.proposal, p);
    return {
      ...result,
      basis: p.basis,
      promptVersion: capability + '.v1',
      status: 'PROPOSAL' as const,
      humanConfirmationRequired: true as const,
    };
  }
  async ask(principal: Principal, input: z.infer<typeof askInput>, signal?: AbortSignal) {
    const resolve = () => this.context.resolve(principal, input.context);
    return this.execute(
      principal,
      'ask',
      await resolve(),
      { question: input.question },
      input.reasoning,
      resolve,
      signal,
    );
  }
  async discussion(
    principal: Principal,
    input: z.infer<typeof discussionInput>,
    signal?: AbortSignal,
  ) {
    const resolve = () => this.context.resolve(principal, input.context);
    return this.execute(
      principal,
      'discussion',
      await resolve(),
      {},
      input.reasoning,
      resolve,
      signal,
    );
  }
  async scenario(principal: Principal, input: z.infer<typeof scenarioInput>, signal?: AbortSignal) {
    const resolve = async () =>
      (
        await this.context.presentation.resolve(
          principal,
          input.presentationId,
          input.screenId,
          true,
        )
      ).package;
    const p = await resolve(),
      result = await this.execute(
        principal,
        'scenario',
        p,
        { screenType: input.screenType, scenarioGoal: input.scenarioGoal, notes: input.notes },
        input.reasoning,
        resolve,
        signal,
      );
    const proposal = outputs.scenario.parse(result.proposal);
    if (proposal.affectedComponents.some((id) => !p.nodeIds.includes(id)))
      throw new AIError('AI_OUTPUT_INVALID');
    return { ...result, proposal };
  }
  async visual(principal: Principal, input: z.infer<typeof visualInput>, signal?: AbortSignal) {
    const original = await this.context.presentation.resolve(
      principal,
      input.presentationId,
      input.screenId,
      true,
    );
    const result = await this.execute(
      principal,
      'visual',
      original.package,
      {
        instruction: input.instruction,
        allowedOperations: ['NODE_VISUAL', 'CONNECTION_VISUAL', 'ADD_OVERLAY', 'RESET_VISUALS'],
      },
      input.reasoning,
      async () =>
        (
          await this.context.presentation.resolve(
            principal,
            input.presentationId,
            input.screenId,
            true,
          )
        ).package,
      signal,
    );
    const proposal = outputs.visual.parse(result.proposal),
      preview = await validateVisualPreview(this.db, principal, original, proposal);
    return { ...result, proposal, preview };
  }
  async summary(principal: Principal, meetingId: string, reasoning: boolean, signal?: AbortSignal) {
    const resolve = () => this.context.meeting.frozen(principal, meetingId);
    return this.execute(principal, 'summary', await resolve(), {}, reasoning, resolve, signal);
  }
  async classify(principal: Principal, reviewId: string, reasoning: boolean, signal?: AbortSignal) {
    const current = await this.context.meeting.review(principal, reviewId),
      result = await this.execute(
        principal,
        'classify',
        current.package,
        {},
        reasoning,
        async () => (await this.context.meeting.review(principal, reviewId)).package,
        signal,
      );
    const proposal = outputs.classify.parse(result.proposal);
    if (new Set(proposal.suggestions.map((s) => s.itemId)).size !== proposal.suggestions.length)
      throw new AIError('AI_OUTPUT_INVALID');
    for (const suggestion of proposal.suggestions) {
      const item = current.items.find((i) => i.id === suggestion.itemId);
      if (!item) throw new AIError('AI_OUTPUT_INVALID');
      try {
        transition(item.classification, suggestion.classification);
      } catch {
        throw new AIError('AI_OUTPUT_INVALID');
      }
      if (
        (suggestion.decision && suggestion.classification !== 'DECISION') ||
        (suggestion.action && suggestion.classification !== 'ACTION')
      )
        throw new AIError('AI_OUTPUT_INVALID');
    }
    return { ...result, proposal };
  }
}
