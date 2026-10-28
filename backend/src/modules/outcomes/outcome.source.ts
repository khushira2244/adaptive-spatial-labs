import { and, eq, inArray } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import {
  frozenCaptures,
  meetingSnapshots,
  publicationRevisions,
} from '../meetings/meeting.schema.js';
import type { PublicationBody, StartPayload, FrozenPayload } from '../meetings/meeting.schema.js';
import { missing } from './outcome.access.js';
export type SourceEntry = {
  key: string;
  category: string;
  representation: Record<string, unknown>;
};
export type ReviewSource = {
  captureId: string;
  snapshotId: string;
  architectureId: string;
  screens: StartPayload['screens'];
  shared: FrozenPayload['shared'];
  participants: FrozenPayload['participants'];
  entries: SourceEntry[];
  evidenceKeys: string[];
};
export async function frozenSource(
  db: Executor,
  meetingId: string,
  captureId: string,
): Promise<ReviewSource> {
  const [c] = await db
    .select()
    .from(frozenCaptures)
    .where(and(eq(frozenCaptures.id, captureId), eq(frozenCaptures.meetingId, meetingId)));
  if (!c) throw missing();
  const [s] = await db
    .select()
    .from(meetingSnapshots)
    .where(
      and(eq(meetingSnapshots.id, c.payload.snapshotId), eq(meetingSnapshots.meetingId, meetingId)),
    );
  if (!s) throw missing();
  const entries: SourceEntry[] = [],
    evidenceKeys: string[] = [];
  for (const screen of s.payload.screens) {
    evidenceKeys.push('screen:' + screen.definitionId);
    for (const i of screen.definition.inclusions) {
      const key = 'inclusion:' + screen.definitionId + ':' + i.id;
      entries.push({
        key,
        category:
          typeof i.representation.category === 'string' ? i.representation.category : i.kind,
        representation: i.representation,
      });
      evidenceKeys.push(key);
    }
  }
  const revisions = c.payload.publications.length
    ? await db
        .select({
          id: publicationRevisions.id,
          publicationId: publicationRevisions.publicationId,
          body: publicationRevisions.body,
          createdAt: publicationRevisions.createdAt,
        })
        .from(publicationRevisions)
        .where(
          inArray(
            publicationRevisions.id,
            c.payload.publications.map((p) => p.revisionId),
          ),
        )
    : [];
  const byRevision = new Map(revisions.map((r) => [r.id, r]));
  for (const p of c.payload.publications) {
    const r = byRevision.get(p.revisionId);
    if (!r || r.publicationId !== p.publicationId) throw missing();
    const body: PublicationBody = r.body,
      key = 'publication:' + p.revisionId;
    entries.push({
      key,
      category: body.category,
      representation: {
        ...body.content,
        scope: body.scope,
        author: body.author,
        raisedAt: r.createdAt.toISOString(),
      },
    });
    evidenceKeys.push(key);
  }
  return {
    captureId: c.id,
    snapshotId: s.id,
    architectureId: s.payload.architectureId,
    screens: s.payload.screens,
    shared: c.payload.shared,
    participants: c.payload.participants,
    entries,
    evidenceKeys,
  };
}
export function seedText(e: SourceEntry) {
  return {
    title:
      (typeof e.representation.title === 'string' ? e.representation.title : e.category).slice(
        0,
        200,
      ) || 'Captured item',
    summary: (typeof e.representation.body === 'string' ? e.representation.body : '').slice(
      0,
      4000,
    ),
  };
}
