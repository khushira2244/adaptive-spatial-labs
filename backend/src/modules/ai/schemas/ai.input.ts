import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../../shared/validation/uuid-identity.js';
import { semanticScopeSchema } from '../../knowledge/knowledge.input.js';
import { screenTypes } from '../../presentations/presentation.input.js';
export const contextInput = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('ARCHITECTURE'),
      projectId: uuid,
      scope: semanticScopeSchema,
      knowledgeIds: z.array(uuid).max(8).default([]),
      sourceReferenceIds: z.array(uuid).max(8).default([]),
      expandBoundary: z.boolean().default(false),
    })
    .strict(),
  z.object({ kind: z.literal('PRESENTATION'), presentationId: uuid, screenId: uuid }).strict(),
  z.object({ kind: z.literal('MEETING'), meetingId: uuid }).strict(),
]);
const tier = { reasoning: z.boolean().default(false) };
export const askInput = z
  .object({ context: contextInput, question: z.string().trim().min(1).max(2000), ...tier })
  .strict();
export const discussionInput = z.object({ context: contextInput, ...tier }).strict();
export const scenarioInput = z
  .object({
    presentationId: uuid,
    screenId: uuid,
    screenType: z.enum(screenTypes).exclude(['MAIN_ARCHITECTURE']),
    scenarioGoal: z.string().trim().min(1).max(1000),
    notes: z.string().max(4000),
    ...tier,
  })
  .strict();
export const visualInput = z
  .object({
    presentationId: uuid,
    screenId: uuid,
    instruction: z.string().trim().min(1).max(2000),
    ...tier,
  })
  .strict();
export const frozenInput = z.object({ ...tier }).strict();
export type ContextInput = z.infer<typeof contextInput>;
