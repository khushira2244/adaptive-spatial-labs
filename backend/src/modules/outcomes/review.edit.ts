import { eq, and } from 'drizzle-orm';
import type { Transaction } from '../../shared/database/client.js';
import {
  meetingReviews,
  reviewItems,
  decisions,
  actionItems,
  reviewOutcomeLinks,
} from './outcome.schema.js';
import type { ReviewCommand } from './outcome.input.js';
import type { ReviewSource } from './outcome.source.js';
import { OutcomeRepository } from './outcome.repository.js';
import { validateEvidence, transition, invalid } from './outcome.validation.js';
import { missing } from './outcome.access.js';
export async function editReview(
  tx: Transaction,
  r: typeof meetingReviews.$inferSelect,
  source: ReviewSource,
  input: ReviewCommand,
  actorId: string,
  newId: () => string,
) {
  const repo = new OutcomeRepository(tx),
    c = await repo.contents(r.id);
  if (input.action === 'BEGIN') return;
  if (input.action === 'SUMMARY') {
    await tx
      .update(meetingReviews)
      .set({ summary: input.summary })
      .where(eq(meetingReviews.id, r.id));
    return;
  }
  if (input.action === 'ADD_MANUAL') {
    if (c.items.length >= 2304) throw invalid('Review item limit reached.');
    validateEvidence(source, input.evidenceKeys);
    await tx.insert(reviewItems).values({
      reviewId: r.id,
      sourceKey: 'manual:' + newId(),
      category: 'MANUAL',
      title: input.title,
      summary: input.summary,
      evidenceKeys: input.evidenceKeys,
      sortOrder: c.items.length,
    });
    return;
  }
  if (input.action === 'REORDER') {
    if (
      input.itemIds.length !== c.items.length ||
      input.itemIds.some((id) => !c.items.some((i) => i.id === id))
    )
      throw invalid('Reorder must name every review item exactly once.');
    for (const [i, id] of input.itemIds.entries())
      await tx
        .update(reviewItems)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(reviewItems.id, id));
    return;
  }
  if (input.action === 'REMOVE_OUTCOME') {
    const key = input.kind === 'DECISION' ? 'decisionId' : 'actionId';
    const table = input.kind === 'DECISION' ? decisions : actionItems;
    if (
      !(input.kind === 'DECISION' ? c.decisions : c.actions).some((o) => o.id === input.outcomeId)
    )
      throw missing();
    if (input.kind === 'DECISION' && c.actions.some((a) => a.decisionId === input.outcomeId))
      throw invalid('Remove the primary Decision binding from related actions first.');
    await tx.delete(reviewOutcomeLinks).where(eq(reviewOutcomeLinks[key], input.outcomeId));
    await tx.delete(table).where(and(eq(table.id, input.outcomeId), eq(table.reviewId, r.id)));
    return;
  }
  if (input.action === 'DECISION' || input.action === 'ACTION') {
    validateEvidence(source, input.evidenceKeys);
    const selected = input.itemIds.map((id) => c.items.find((i) => i.id === id));
    if (selected.some((i) => !i || !i.retained))
      throw invalid('Outcome must link retained review items.');
    if (selected.some((i) => ['RAISED', 'NOT_DISCUSSED'].includes(i!.classification)))
      throw invalid('Discuss the source assessment before human promotion.');
    const kind = input.action,
      existingId = kind === 'DECISION' ? input.decisionId : input.actionId;
    const existing = existingId
      ? (kind === 'DECISION' ? c.decisions : c.actions).find((o) => o.id === existingId)
      : undefined;
    if (existingId && !existing) throw missing();
    if (!existing && c.decisions.length + c.actions.length >= 256)
      throw invalid('Outcome limit reached.');
    const id = existingId ?? newId();
    if (input.action === 'DECISION') {
      const values = {
        title: input.title,
        statement: input.statement,
        rationale: input.rationale,
        evidenceKeys: input.evidenceKeys,
      };
      if (existing) await tx.update(decisions).set(values).where(eq(decisions.id, id));
      else
        await tx.insert(decisions).values({
          id,
          reviewId: r.id,
          meetingId: r.meetingId,
          projectId: r.projectId,
          createdBy: actorId,
          ...values,
        });
    } else {
      const assignee = input.assigneeParticipantId
        ? source.participants.find((p) => p.id === input.assigneeParticipantId)
        : null;
      if (input.assigneeParticipantId && !assignee)
        throw invalid('Assignee must be a frozen Meeting actor.');
      if (input.decisionId && !c.decisions.some((d) => d.id === input.decisionId))
        throw invalid('Primary Decision belongs to another review.');
      const values = {
        title: input.title,
        description: input.description,
        evidenceKeys: input.evidenceKeys,
        assigneeParticipantId: input.assigneeParticipantId,
        assignee: assignee?.actor ?? null,
        dueDate: input.dueDate,
        decisionId: input.decisionId,
        updatedAt: new Date(),
      };
      if (existing) await tx.update(actionItems).set(values).where(eq(actionItems.id, id));
      else
        await tx.insert(actionItems).values({
          id,
          reviewId: r.id,
          meetingId: r.meetingId,
          projectId: r.projectId,
          createdBy: actorId,
          ...values,
        });
    }
    const field = kind === 'DECISION' ? 'decisionId' : 'actionId';
    await tx.delete(reviewOutcomeLinks).where(eq(reviewOutcomeLinks[field], id));
    await tx
      .insert(reviewOutcomeLinks)
      .values(input.itemIds.map((itemId) => ({ reviewId: r.id, itemId, [field]: id })));
    // Promotion is an explicit human command; independent assessments can also keep ADDRESSED etc.
    for (const i of selected)
      if (i!.classification === 'DISCUSSED')
        await tx
          .update(reviewItems)
          .set({ classification: kind, updatedAt: new Date() })
          .where(eq(reviewItems.id, i!.id));
    return;
  }
  if ('itemId' in input) {
    const item = c.items.find((i) => i.id === input.itemId);
    if (!item) throw missing();
    let values: Partial<typeof reviewItems.$inferInsert> = { updatedAt: new Date() };
    if (input.action === 'EDIT_ITEM')
      values = { ...values, title: input.title, summary: input.summary };
    if (input.action === 'CLASSIFY') {
      transition(item.classification, input.classification);
      values.classification = input.classification;
    }
    if (input.action === 'RETAIN') values.retained = input.retained;
    if (input.action === 'EVIDENCE') {
      validateEvidence(source, input.evidenceKeys);
      values.evidenceKeys = input.evidenceKeys;
    }
    await tx.update(reviewItems).set(values).where(eq(reviewItems.id, item.id));
  }
}
