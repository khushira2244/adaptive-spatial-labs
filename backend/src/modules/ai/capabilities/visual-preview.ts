import { randomUUID } from 'node:crypto';
import type { Database } from '../../../shared/database/client.js';
import type { Principal } from '../../../shared/auth/principal.js';
import { presentationAccess } from '../../presentations/presentation.access.js';
import { validateDefinition } from '../../presentations/presentation.validation.js';
import { visualOutput } from '../schemas/ai.output.js';
import type { z } from 'zod';
import type { PresentationAIContext } from './presentation-context.js';
import { AIError } from '../ai.error.js';
export async function validateVisualPreview(
  db: Database,
  principal: Principal,
  context: Awaited<ReturnType<PresentationAIContext['resolve']>>,
  proposal: z.infer<typeof visualOutput>,
) {
  const draft = structuredClone(context.screen.draft),
    overlays = structuredClone(context.screen.overlays),
    allowed = context.package;
  if (!draft.understandingAccepted) throw new AIError('AI_OUTPUT_INVALID');
  for (const op of proposal.operations) {
    if (op.action === 'NODE_VISUAL') {
      if (!allowed.nodeIds.includes(op.nodeId)) throw new AIError('AI_OUTPUT_INVALID');
      draft.nodeOverrides = draft.nodeOverrides.filter((o) => o.nodeId !== op.nodeId);
      draft.nodeOverrides.push({ nodeId: op.nodeId, visual: op.visual });
    }
    if (op.action === 'CONNECTION_VISUAL') {
      if (!allowed.connectionIds.includes(op.connectionId)) throw new AIError('AI_OUTPUT_INVALID');
      draft.connectionOverrides = draft.connectionOverrides.filter(
        (o) => o.connectionId !== op.connectionId,
      );
      draft.connectionOverrides.push({ connectionId: op.connectionId, visual: op.visual });
    }
    if (op.action === 'ADD_OVERLAY') {
      if (
        !allowed.nodeIds.includes(op.sourceNodeId) ||
        !allowed.nodeIds.includes(op.destinationNodeId)
      )
        throw new AIError('AI_OUTPUT_INVALID');
      overlays.push({
        id: randomUUID(),
        sourceNodeId: op.sourceNodeId,
        destinationNodeId: op.destinationNodeId,
        label: op.label,
        visual: op.visual,
      });
    }
    if (op.action === 'RESET_VISUALS') {
      draft.nodeOverrides = [];
      draft.connectionOverrides = [];
    }
  }
  try {
    return await db.transaction(async (tx) => {
      const { presentation } = await presentationAccess(
        tx,
        principal,
        context.package.basis.presentationId as string,
        'EDIT',
      );
      return validateDefinition(tx, presentation, draft, overlays, context.screen.inclusions);
    });
  } catch (e) {
    if (e instanceof AIError) throw e;
    throw new AIError('AI_OUTPUT_INVALID');
  }
}
