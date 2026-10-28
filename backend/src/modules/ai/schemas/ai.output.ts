import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../../shared/validation/uuid-identity.js';
import { nodeVisual, edgeVisual } from '../../presentations/presentation.input.js';
import { classification } from '../../outcomes/outcome.input.js';
const text = z.string().trim().min(1).max(2000),
  short = z.string().trim().min(1).max(400);
export const references = z
  .array(z.string().min(1).max(150))
  .max(32)
  .refine((a) => new Set(a).size === a.length);
const caveats = { assumptions: z.array(short).max(8), uncertainties: z.array(short).max(8) };
export const askOutput = z
  .object({ answer: text, references, ...caveats, followUps: z.array(short).max(5) })
  .strict();
export const discussionOutput = z
  .object({
    suggestions: z
      .array(
        z
          .object({
            question: short,
            why: short,
            category: z.enum(['RISK', 'ASSUMPTION', 'MISSING_CASE', 'TRADEOFF']),
            references,
            uncertainty: short,
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
export const scenarioOutput = z
  .object({
    interpretedScenario: text,
    affectedComponents: z.array(uuid).max(64),
    expectedBehavior: z.array(short).max(12),
    interpretation: z.enum(['SUCCESS', 'FAILURE', 'RECOVERY', 'DISCUSSION', 'CUSTOM']),
    ...caveats,
    references,
  })
  .strict();
export const visualOperation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('NODE_VISUAL'), nodeId: uuid, visual: nodeVisual }).strict(),
  z
    .object({ action: z.literal('CONNECTION_VISUAL'), connectionId: uuid, visual: edgeVisual })
    .strict(),
  z
    .object({
      action: z.literal('ADD_OVERLAY'),
      sourceNodeId: uuid,
      destinationNodeId: uuid,
      label: z.string().max(120),
      visual: edgeVisual,
    })
    .strict(),
  z.object({ action: z.literal('RESET_VISUALS') }).strict(),
]);
export const visualOutput = z
  .object({ operations: z.array(visualOperation).min(1).max(32), explanation: text, ...caveats })
  .strict();
const candidate = z
  .object({ title: z.string().min(1).max(200), description: text, references })
  .strict();
export const summaryOutput = z
  .object({
    summary: text,
    themes: z.array(short).max(8),
    unresolvedTopics: z.array(short).max(12),
    potentialDecisions: z.array(candidate).max(8),
    potentialActions: z.array(candidate).max(8),
    references,
    ...caveats,
  })
  .strict();
export const classifyOutput = z
  .object({
    suggestions: z
      .array(
        z
          .object({
            itemId: uuid,
            classification,
            rationale: short,
            references,
            decision: candidate.nullable(),
            action: candidate.nullable(),
          })
          .strict(),
      )
      .max(32),
    ...caveats,
  })
  .strict();
export const outputs = {
  ask: askOutput,
  discussion: discussionOutput,
  scenario: scenarioOutput,
  visual: visualOutput,
  summary: summaryOutput,
  classify: classifyOutput,
};
export type Capability = keyof typeof outputs;
