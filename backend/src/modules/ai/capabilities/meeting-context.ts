import type { Database } from '../../../shared/database/client.js';
import type { Principal } from '../../../shared/auth/principal.js';
import { meetingAccess } from '../../meetings/meeting.access.js';
import { MeetingQuery } from '../../meetings/meeting.query.js';
import { frozenCaptures } from '../../meetings/meeting.schema.js';
import { frozenSource, type ReviewSource } from '../../outcomes/outcome.source.js';
import { ownerMeeting, reviewAccess } from '../../outcomes/outcome.access.js';
import { OutcomeRepository } from '../../outcomes/outcome.repository.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../../../shared/errors/app-error.js';
import { safeRepresentation } from './presentation-context.js';
import type { ContextPackage } from './context-package.js';
export function frozenPackage(s: ReviewSource): ContextPackage {
  return {
    payload: {
      captureId: s.captureId,
      snapshotId: s.snapshotId,
      screenDefinitions: s.screens.map((screen) => ({
        key: 'screen:' + screen.definitionId,
        name: screen.definition.draft.name,
        scope: screen.definition.draft.scope,
        scenarioGoal: screen.definition.draft.scenarioGoal,
      })),
      finalShared: { screenId: s.shared.screenId, focus: s.shared.focus },
      entries: s.entries.map((e) => ({
        key: e.key,
        category: e.category,
        representation: safeRepresentation(e.representation),
      })),
    },
    references: s.evidenceKeys,
    nodeIds: [],
    connectionIds: [],
    basis: { captureId: s.captureId, snapshotId: s.snapshotId },
  };
}
export class MeetingAIContext {
  constructor(private db: Database) {}
  async frozen(principal: Principal, meetingId: string) {
    return this.db.transaction(async (tx) => {
      await ownerMeeting(tx, principal, meetingId);
      const [c] = await tx
        .select({ id: frozenCaptures.id })
        .from(frozenCaptures)
        .where(eq(frozenCaptures.meetingId, meetingId));
      if (!c) throw new AppError('DOMAIN_NOT_FOUND', 'Frozen Meeting not found.');
      return frozenPackage(await frozenSource(tx, meetingId, c.id));
    });
  }
  async current(principal: Principal, meetingId: string) {
    const m = await new MeetingQuery(this.db).read(principal, meetingId);
    if (m.state === 'ENDED')
      return this.db.transaction(async (tx) => {
        await meetingAccess(tx, principal, meetingId);
        return frozenPackage(await frozenSource(tx, meetingId, m.frozenCapture!.id));
      });
    if (!m.snapshot || !m.shared)
      throw new AppError('INVALID_LIFECYCLE', 'Started Meeting context required.');
    return {
      payload: {
        screen: m.snapshot.screens
          .filter((s) => s.id === m.shared!.screenId)
          .map((s) => ({ name: s.definition.draft.name, scope: s.definition.draft.scope })),
        focus: m.shared.focus,
        publications: m.context.publications.map((p) => ({
          key: 'publication:' + p.revisionId,
          category: p.body.category,
          representation: safeRepresentation(p.body.content),
        })),
        prepared: m.context.prepared.map((i) => ({
          key: 'inclusion:' + i.id,
          kind: i.kind,
          representation: safeRepresentation(i.representation),
        })),
      },
      references: [
        ...m.context.publications.map((p) => 'publication:' + p.revisionId),
        ...m.context.prepared.map((i) => 'inclusion:' + i.id),
      ],
      nodeIds: [],
      connectionIds: [],
      basis: { meetingId, meetingStamp: m.changeStamp },
    } satisfies ContextPackage;
  }
  async review(principal: Principal, reviewId: string) {
    return this.db.transaction(async (tx) => {
      const review = await reviewAccess(tx, principal, reviewId, true);
      if (review.state === 'SAVED')
        throw new AppError('INVALID_LIFECYCLE', 'Saved review is immutable.');
      const p = frozenPackage(await frozenSource(tx, review.meetingId, review.captureId)),
        contents = await new OutcomeRepository(tx).contents(reviewId);
      const items = contents.items
        .filter((i) => i.retained)
        .map((i) => ({
          id: i.id,
          sourceKey: i.sourceKey,
          title: i.title,
          summary: i.summary,
          classification: i.classification,
          evidenceKeys: i.evidenceKeys,
        }));
      p.payload.review = { summary: review.summary, items };
      p.basis = { ...p.basis, reviewId, reviewStamp: review.changeStamp };
      return { package: p, items };
    });
  }
}
