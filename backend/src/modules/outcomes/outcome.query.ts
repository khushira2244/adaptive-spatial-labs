import { and, eq, desc, count } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import { meetingReviews, reviewItems, decisions, actionItems } from './outcome.schema.js';
import { meetings } from '../meetings/meeting.schema.js';
import { reviewAccess, missing } from './outcome.access.js';
import { frozenSource } from './outcome.source.js';
import { OutcomeRepository } from './outcome.repository.js';
export class OutcomeQuery {
  constructor(private db: Database) {}
  async byMeeting(principal: Principal, id: string, limit: number, offset: number) {
    const [r] = await this.db
      .select({ id: meetingReviews.id })
      .from(meetingReviews)
      .where(eq(meetingReviews.meetingId, id));
    if (!r) throw missing();
    return this.read(principal, r.id, limit, offset);
  }
  async read(principal: Principal, id: string, limit: number, offset: number) {
    return this.db.transaction(async (tx) => {
      const r = await reviewAccess(tx, principal, id),
        source = await frozenSource(tx, r.meetingId, r.captureId),
        c = await new OutcomeRepository(tx).contents(id);
      const owner = principal.actor.kind === 'USER' && principal.actor.userId === r.ownerId;
      const items = owner ? c.items : c.items.filter((i) => i.retained);
      const allowed = new Set(items.map((i) => i.id));
      const [m] = await tx
        .select({
          title: meetings.title,
          presentationId: meetings.presentationId,
          scheduledAt: meetings.scheduledAt,
        })
        .from(meetings)
        .where(eq(meetings.id, r.meetingId));
      // Published project projection includes only the deliberately retained subset; ignored draft text is owner-only.
      const keys = new Set(
        items
          .flatMap((i) => [i.sourceKey, ...i.evidenceKeys])
          .concat(
            c.decisions.flatMap((d) => d.evidenceKeys),
            c.actions.flatMap((a) => a.evidenceKeys),
          ),
      );
      const visibleSource = owner
        ? source
        : {
            ...source,
            entries: source.entries.filter((e) => keys.has(e.key)),
            screens: source.screens.map((s) => ({
              ...s,
              definition: {
                ...s.definition,
                inclusions: s.definition.inclusions.filter((i) =>
                  keys.has('inclusion:' + s.definitionId + ':' + i.id),
                ),
              },
            })),
          };
      await new PrincipalResolver(tx).requireActive(principal);
      return {
        ...r,
        meeting: m,
        source: visibleSource,
        items: items.slice(offset, offset + limit),
        count: items.length,
        limit,
        offset,
        decisions: c.decisions,
        actions: c.actions,
        links: c.links.filter((l) => allowed.has(l.itemId)),
      };
    });
  }
  async project(
    principal: Principal,
    id: string,
    kind: 'decisions' | 'actions' | 'assessments',
    limit: number,
    offset: number,
  ) {
    return this.db.transaction(async (tx) => {
      await new ProjectAccess(tx).read(principal, id);
      const table =
        kind === 'decisions' ? decisions : kind === 'actions' ? actionItems : reviewItems;
      const condition = and(
        eq(meetingReviews.projectId, id),
        eq(meetingReviews.state, 'SAVED'),
        ...(kind === 'assessments' ? [eq(reviewItems.retained, true)] : []),
      );
      const items = await tx
        .select({ outcome: table })
        .from(table)
        .innerJoin(meetingReviews, eq(table.reviewId, meetingReviews.id))
        .where(condition)
        .orderBy(desc(meetingReviews.savedAt), table.id)
        .limit(limit)
        .offset(offset);
      const [n] = await tx
        .select({ n: count() })
        .from(table)
        .innerJoin(meetingReviews, eq(table.reviewId, meetingReviews.id))
        .where(condition);
      await new PrincipalResolver(tx).requireActive(principal);
      return { items: items.map((i) => i.outcome), count: n!.n, limit, offset };
    });
  }
  async activity(principal: Principal, id: string) {
    return this.db.transaction(async (tx) => {
      await new ProjectAccess(tx).read(principal, id);
      const [latest] = await tx
        .select({
          reviewId: meetingReviews.id,
          meetingId: meetingReviews.meetingId,
          title: meetings.title,
          savedAt: meetingReviews.savedAt,
        })
        .from(meetingReviews)
        .innerJoin(meetings, eq(meetings.id, meetingReviews.meetingId))
        .where(and(eq(meetingReviews.projectId, id), eq(meetingReviews.state, 'SAVED')))
        .orderBy(desc(meetingReviews.savedAt), meetingReviews.id)
        .limit(1);
      const totals: Record<string, number> = {};
      for (const [name, table] of [
        ['decisions', decisions],
        ['openActions', actionItems],
      ] as const) {
        const [n] = await tx
          .select({ n: count() })
          .from(table)
          .innerJoin(meetingReviews, eq(table.reviewId, meetingReviews.id))
          .where(and(eq(meetingReviews.projectId, id), eq(meetingReviews.state, 'SAVED')));
        totals[name] = n!.n;
      }
      for (const state of ['UNRESOLVED', 'DEFERRED'] as const) {
        const [n] = await tx
          .select({ n: count() })
          .from(reviewItems)
          .innerJoin(meetingReviews, eq(reviewItems.reviewId, meetingReviews.id))
          .where(
            and(
              eq(meetingReviews.projectId, id),
              eq(meetingReviews.state, 'SAVED'),
              eq(reviewItems.retained, true),
              eq(reviewItems.classification, state),
            ),
          );
        totals[state.toLowerCase()] = n!.n;
      }
      await new PrincipalResolver(tx).requireActive(principal);
      return { latest: latest ?? null, ...totals };
    });
  }
}
