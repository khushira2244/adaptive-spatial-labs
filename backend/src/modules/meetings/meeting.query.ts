import { and, eq, inArray, or } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import {
  meetings,
  meetingParticipants,
  meetingSnapshots,
  meetingShared,
  presenterTransfers,
  sharedMeetingItems,
  publicationRevisions,
  frozenCaptures,
  meetingInvitations,
} from './meeting.schema.js';
import { meetingAccess, missing } from './meeting.access.js';
export class MeetingQuery {
  constructor(private db: Database) {}
  async list(principal: Principal, limit: number, offset: number) {
    const actor = requireRegisteredPrincipal(principal);
    await new PrincipalResolver(this.db).requireActive(principal);
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(meetings)
        .where(
          inArray(
            meetings.id,
            tx
              .select({ id: meetingParticipants.meetingId })
              .from(meetingParticipants)
              .where(
                and(
                  eq(meetingParticipants.userId, actor.userId),
                  eq(meetingParticipants.state, 'ADMITTED'),
                ),
              ),
          ),
        )
        .orderBy(meetings.id)
        .limit(limit)
        .offset(offset);
      const items = [];
      for (const row of rows) {
        try {
          await meetingAccess(tx, principal, row.id);
          items.push({
            id: row.id,
            title: row.title,
            state: row.state,
            changeStamp: row.changeStamp,
            scheduledAt: row.scheduledAt,
          });
        } catch (error) {
          if (error instanceof AppError && error.code === 'DOMAIN_NOT_FOUND') continue;
          throw error;
        }
      }
      return { items, count: items.length, limit, offset };
    });
  }
  async read(principal: Principal, id: string) {
    return this.db.transaction(async (tx) => {
      const { meeting: m, participant: self } = await meetingAccess(tx, principal, id);
      const participants = await tx
        .select()
        .from(meetingParticipants)
        .where(eq(meetingParticipants.meetingId, id));
      const [snapshot] = await tx
        .select()
        .from(meetingSnapshots)
        .where(eq(meetingSnapshots.meetingId, id));
      const [shared] = await tx.select().from(meetingShared).where(eq(meetingShared.meetingId, id));
      const transfers = await tx
        .select()
        .from(presenterTransfers)
        .where(and(eq(presenterTransfers.meetingId, id), eq(presenterTransfers.state, 'PENDING')));
      const items = await tx
        .select()
        .from(sharedMeetingItems)
        .where(and(eq(sharedMeetingItems.meetingId, id), eq(sharedMeetingItems.visible, true)));
      const revisions = items.length
        ? await tx
            .select({
              id: publicationRevisions.id,
              publicationId: publicationRevisions.publicationId,
              sequence: publicationRevisions.sequence,
              body: publicationRevisions.body,
            })
            .from(publicationRevisions)
            .where(
              inArray(
                publicationRevisions.id,
                items.map((i) => i.currentRevisionId!),
              ),
            )
        : [];
      const byRevision = new Map(revisions.map((r) => [r.id, r]));
      const publications = items.map((item) => {
        const revision = byRevision.get(item.currentRevisionId!);
        if (!revision || revision.publicationId !== item.id) throw missing();
        return {
          id: item.id,
          revisionId: revision.id,
          sequence: revision.sequence,
          changeStamp: item.changeStamp,
          authorParticipantId: item.authorParticipantId,
          body: revision.body,
        };
      });
      const [capture] = await tx
        .select()
        .from(frozenCaptures)
        .where(eq(frozenCaptures.meetingId, id));
      let architecture;
      if (snapshot) {
        const family = await new ArchitectureRepository(tx).load(snapshot.payload.architectureId);
        architecture = {
          rootGraphId: family.rootGraphId,
          graphs: family.graphs.map((g) => ({
            id: g.id,
            kind: g.kind,
            name: g.name,
            nodes: g.nodes.map(({ sourceReferenceIds: _, ...n }) => n),
            connections: g.connections.map(({ sourceReferenceIds: _, ...e }) => e),
          })),
          innerLinks: family.innerLinks,
        };
      }
      const owner = principal.actor.kind === 'USER' && principal.actor.userId === m.ownerId;
      const invites = owner
        ? (
            await tx.select().from(meetingInvitations).where(eq(meetingInvitations.meetingId, id))
          ).map((i) => ({
            id: i.id,
            email: i.email,
            state: i.state === 'PENDING' && i.expiresAt <= new Date() ? 'EXPIRED' : i.state,
            expiresAt: i.expiresAt,
          }))
        : undefined;
      await meetingAccess(tx, principal, id);
      return {
        id: m.id,
        projectId: m.projectId,
        presentationId: m.presentationId,
        title: m.title,
        state: m.state,
        changeStamp: m.changeStamp,
        scheduledAt: m.scheduledAt,
        startFromScreenId: m.startFromScreenId,
        selfParticipantId: self.id,
        ownerId: m.ownerId,
        snapshot: snapshot ? { id: snapshot.id, ...snapshot.payload } : null,
        shared: shared?.state ?? null,
        participants: participants.map((p) => ({
          id: p.id,
          actor: p.userId
            ? { kind: 'USER', userId: p.userId }
            : { kind: 'SCOPED_GUEST', guestId: p.guestId },
          state: p.state,
          connected: p.connected,
        })),
        pendingTransfer: transfers[0]
          ? {
              id: transfers[0].id,
              targetParticipantId: transfers[0].targetParticipantId,
              requesterParticipantId: transfers[0].requesterParticipantId,
              authorityGeneration: transfers[0].authorityGeneration,
            }
          : null,
        context: {
          prepared:
            snapshot && shared
              ? (snapshot.payload.screens.find((s) => s.id === shared.state.screenId)?.definition
                  .inclusions ?? [])
              : [],
          publications,
        },
        frozenCapture: capture ? { id: capture.id, payload: capture.payload } : null,
        ...(architecture ? { architecture } : {}),
        ...(invites ? { invitations: invites } : {}),
      };
    });
  }
  async revision(principal: Principal, id: string, revisionId: string) {
    return this.db.transaction(async (tx) => {
      await meetingAccess(tx, principal, id);
      const [revision] = await tx
        .select()
        .from(publicationRevisions)
        .innerJoin(
          sharedMeetingItems,
          eq(sharedMeetingItems.id, publicationRevisions.publicationId),
        )
        .where(and(eq(publicationRevisions.id, revisionId), eq(sharedMeetingItems.meetingId, id)));
      if (!revision) throw missing();
      // Historical content is audience-visible only when pinned in the immutable End capture;
      // an author may inspect their own revision, or audience the current visible revision.
      const { participant } = await meetingAccess(tx, principal, id);
      const item = revision.shared_meeting_items,
        r = revision.shared_meeting_item_revisions;
      const [capture] = await tx
        .select()
        .from(frozenCaptures)
        .where(eq(frozenCaptures.meetingId, id));
      const pinned = !!capture?.payload.publications.some(
        (p) => p.publicationId === item.id && p.revisionId === r.id,
      );
      if (
        item.authorParticipantId !== participant.id &&
        !(item.visible && item.currentRevisionId === r.id) &&
        !pinned
      )
        throw missing();
      return { id: r.id, publicationId: item.id, sequence: r.sequence, body: r.body };
    });
  }
}
