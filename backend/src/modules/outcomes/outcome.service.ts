import { randomUUID } from 'node:crypto';
import { eq, and, sql } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { advanceChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import { meetingReviews, reviewItems, type Manifest } from './outcome.schema.js';
import { ownerMeeting, reviewAccess, missing } from './outcome.access.js';
import { frozenSource, seedText } from './outcome.source.js';
import { OutcomeRepository } from './outcome.repository.js';
import { validateFinal } from './outcome.validation.js';
import { editReview } from './review.edit.js';
import { saveReview } from './review.save.js';
import type { ReviewCommand } from './outcome.input.js';
export class OutcomeService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
  ) {}
  async create(
    principal: Principal,
    meetingId: string,
    input: { operationId: string; captureId: string },
  ) {
    const r = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'outcomes.create',
        scope: { kind: 'meeting', id: meetingId },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await ownerMeeting(tx, principal, meetingId);
      },
      execute: async ({ tx, emit }) => {
        await tx.execute(sql`SELECT id FROM meetings WHERE id=${meetingId} FOR UPDATE`);
        const m = await ownerMeeting(tx, principal, meetingId),
          source = await frozenSource(tx, meetingId, input.captureId);
        const [existing] = await tx
          .select()
          .from(meetingReviews)
          .where(eq(meetingReviews.meetingId, meetingId));
        if (existing) {
          if (existing.captureId !== input.captureId) throw missing();
          return {
            reference: { kind: 'meeting_review', id: existing.id },
            status: existing.state,
            changeStamp: existing.changeStamp,
          };
        }
        const [review] = await tx
          .insert(meetingReviews)
          .values({
            meetingId,
            captureId: source.captureId,
            projectId: m.projectId,
            ownerId: m.ownerId,
          })
          .returning();
        if (source.entries.length > 2248)
          throw new AppError('DOMAIN_CONFLICT', 'Captured review entry limit exceeded.');
        if (source.entries.length)
          await tx.insert(reviewItems).values(
            source.entries.map((e, i) => ({
              reviewId: review!.id,
              sourceKey: e.key,
              category: e.category,
              ...seedText(e),
              sortOrder: i,
            })),
          );
        return {
          reference: { kind: 'meeting_review', id: review!.id },
          status: 'DRAFT',
          changeStamp: 0,
        };
      },
    });
    return {
      id: r.result.result.reference.id,
      state: r.result.result.status,
      changeStamp: r.result.result.changeStamp,
      replayed: r.result.replayed,
    };
  }
  async command(principal: Principal, id: string, input: ReviewCommand) {
    const r = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'outcomes.' + input.action.toLowerCase(),
        scope: { kind: 'review', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await reviewAccess(tx, principal, id, true);
      },
      execute: async ({ tx, emit }) => {
        const review = await reviewAccess(tx, principal, id, true);
        const next = advanceChangeStamp(review.changeStamp, input.expectedStamp);
        if (review.state === 'SAVED')
          throw new AppError('INVALID_LIFECYCLE', 'Saved review is immutable.');
        const source = await frozenSource(tx, review.meetingId, review.captureId),
          repo = new OutcomeRepository(tx);
        let state = review.state;
        if (input.action === 'SAVE') {
          if (state !== 'READY_TO_SAVE')
            throw new AppError('INVALID_LIFECYCLE', 'Explicit owner readiness required.');
          await saveReview(tx, review, source, requireRegisteredPrincipal(principal).userId, next);
          emit({
            id: randomUUID(),
            kind: 'meeting_review.saved',
            aggregate: { kind: 'meeting_review', id },
            changeStamp: next,
          });
          return { reference: { kind: 'meeting_review', id }, status: 'SAVED', changeStamp: next };
        }
        if (input.action === 'READY') {
          validateFinal(source, await repo.contents(id));
          state = 'READY_TO_SAVE';
        } else if (input.action === 'REOPEN') {
          if (state !== 'READY_TO_SAVE')
            throw new AppError('INVALID_LIFECYCLE', 'Review is not ready.');
          state = 'REVIEWING';
        } else {
          if (state === 'READY_TO_SAVE')
            throw new AppError('INVALID_LIFECYCLE', 'Reopen before changing accepted draft.');
          state = 'REVIEWING';
          await editReview(
            tx,
            review,
            source,
            input,
            requireRegisteredPrincipal(principal).userId,
            randomUUID,
          );
        }
        await tx
          .update(meetingReviews)
          .set({ state, changeStamp: next, updatedAt: new Date() })
          .where(
            and(eq(meetingReviews.id, id), eq(meetingReviews.changeStamp, input.expectedStamp)),
          );
        return { reference: { kind: 'meeting_review', id }, status: state, changeStamp: next };
      },
    });
    const accepted: { manifest?: Manifest | null; savedAt?: Date | null } =
      r.result.result.status === 'SAVED'
        ? await this.db.transaction(async (tx) => {
            const saved = await reviewAccess(tx, principal, id, true);
            return { manifest: saved.manifest, savedAt: saved.savedAt };
          })
        : {};
    return {
      id: r.result.result.reference.id,
      state: r.result.result.status,
      changeStamp: r.result.result.changeStamp,
      ...accepted,
      replayed: r.result.replayed,
    };
  }
}
