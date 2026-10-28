import { eq } from 'drizzle-orm';
import type { Transaction } from '../../shared/database/client.js';
import { meetingReviews, decisions, actionItems } from './outcome.schema.js';
import type { ReviewSource } from './outcome.source.js';
import { OutcomeRepository } from './outcome.repository.js';
import { validateFinal } from './outcome.validation.js';
export async function saveReview(
  tx: Transaction,
  review: typeof meetingReviews.$inferSelect,
  source: ReviewSource,
  actorId: string,
  stamp: number,
) {
  const c = await new OutcomeRepository(tx).contents(review.id);
  validateFinal(source, c);
  // Draft identities are promoted; no duplicate KnowledgeItem or outcome-body mirror.
  await tx.update(decisions).set({ acceptedBy: actorId }).where(eq(decisions.reviewId, review.id));
  await tx
    .update(actionItems)
    .set({ acceptedBy: actorId, updatedAt: new Date() })
    .where(eq(actionItems.reviewId, review.id));
  const retained = c.items.filter((i) => i.retained);
  await tx
    .update(meetingReviews)
    .set({
      state: 'SAVED',
      changeStamp: stamp,
      savedAt: new Date(),
      updatedAt: new Date(),
      manifest: {
        decisionIds: c.decisions.map((d) => d.id),
        actionIds: c.actions.map((a) => a.id),
        itemIds: retained.map((i) => i.id),
        unresolvedIds: retained.filter((i) => i.classification === 'UNRESOLVED').map((i) => i.id),
        deferredIds: retained.filter((i) => i.classification === 'DEFERRED').map((i) => i.id),
        savedBy: actorId,
      },
    })
    .where(eq(meetingReviews.id, review.id));
}
