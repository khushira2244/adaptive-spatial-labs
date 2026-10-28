import { and, eq, max } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import { KnowledgeService } from '../knowledge/knowledge.service.js';
import { SnapshotService } from '../knowledge/snapshot.service.js';
import { meetingAccess, requireLive, missing } from './meeting.access.js';
import { MeetingRepository } from './meeting.repository.js';
import { sharedMeetingItems, publicationRevisions } from './meeting.schema.js';
import { bounded, validateMeetingScope } from './meeting.validation.js';
import type { PublicationCommand } from './meeting.input.js';
import type { Notify } from './meeting.service.js';
export class PublicationService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private knowledge: KnowledgeService,
    private snapshots: SnapshotService,
    private notify: Notify = async () => {},
  ) {}
  async command(principal: Principal, id: string, input: PublicationCommand) {
    const result = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST'
        ? { invitedScope: { kind: 'MEETING' as const, id } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'meeting.publication',
        scope: { kind: 'meeting', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }, previous) => {
        const { participant } = await meetingAccess(tx, principal, id);
        if (previous) {
          const [item] = await tx
            .select()
            .from(sharedMeetingItems)
            .where(
              and(
                eq(sharedMeetingItems.id, previous.reference.id),
                eq(sharedMeetingItems.meetingId, id),
              ),
            );
          if (!item || item.authorParticipantId !== participant.id) throw missing();
        }
      },
      execute: async (context) => {
        const { tx } = context,
          { meeting: m, participant: p } = await meetingAccess(tx, principal, id),
          repo = new MeetingRepository(tx);
        requireLive(m.state);
        requireChangeStamp(m.changeStamp, input.expectedStamp);
        const all = await tx
          .select()
          .from(sharedMeetingItems)
          .where(eq(sharedMeetingItems.meetingId, id));
        if (input.action === 'SHARE' && all.length >= 200)
          throw new AppError('DOMAIN_CONFLICT', 'Publication bound reached.');
        let item =
          input.action === 'SHARE' ? undefined : all.find((i) => i.id === input.publicationId);
        if (input.action !== 'SHARE') {
          if (!item || item.authorParticipantId !== p.id) throw missing();
          requireChangeStamp(item.changeStamp, input.expectedPublicationStamp);
        }
        if (input.action === 'WITHDRAW') {
          await tx
            .update(sharedMeetingItems)
            .set({ visible: false, changeStamp: item!.changeStamp + 1 })
            .where(
              and(
                eq(sharedMeetingItems.id, item!.id),
                eq(sharedMeetingItems.changeStamp, input.expectedPublicationStamp),
              ),
            );
        } else {
          const snapshot = await repo.snapshot(id);
          await validateMeetingScope(tx, m.projectId, snapshot.payload, input.scope);
          const category = input.action === 'SHARE' ? input.category : item!.category;
          let content: Record<string, unknown>,
            originStamp: number | null = null;
          if (input.origin.kind === 'KNOWLEDGE') {
            if (category === 'SNAPSHOT')
              throw new AppError(
                'VALIDATION_ERROR',
                'Snapshot classification requires a Snapshot.',
              );
            const origin = await this.knowledge.readIn(tx, principal, input.origin.id);
            if (
              (origin.projectId && origin.projectId !== m.projectId) ||
              (origin.meetingId && origin.meetingId !== id)
            )
              throw new AppError('VALIDATION_ERROR', 'Private origin is outside this Meeting.');
            requireChangeStamp(origin.changeStamp, input.origin.expectedItemStamp);
            originStamp = origin.changeStamp;
            content = { title: origin.title, body: origin.body };
          } else {
            if (category !== 'SNAPSHOT')
              throw new AppError(
                'VALIDATION_ERROR',
                'Snapshot origin needs Snapshot classification.',
              );
            const origin = await this.snapshots.readIn(tx, principal, input.origin.id);
            if (
              (origin.meetingId && origin.meetingId !== id) ||
              origin.scope.architectureId !== snapshot.payload.architectureId
            )
              throw new AppError('VALIDATION_ERROR', 'Capture is outside this Meeting.');
            content = { scope: origin.scope, payload: origin.payload };
          }
          const body = { category, content, scope: input.scope, author: principal.actor };
          bounded(body, 32768);
          if (!item) {
            const [created] = await tx
              .insert(sharedMeetingItems)
              .values({ meetingId: id, authorParticipantId: p.id, category })
              .returning();
            item = created!;
          }
          const [latest] = await tx
            .select({ sequence: max(publicationRevisions.sequence) })
            .from(publicationRevisions)
            .where(eq(publicationRevisions.publicationId, item.id));
          const [revision] = await tx
            .insert(publicationRevisions)
            .values({
              publicationId: item.id,
              sequence: (latest?.sequence ?? 0) + 1,
              body,
              originKind: input.origin.kind,
              originId: input.origin.id,
              originStamp,
            })
            .returning();
          await tx
            .update(sharedMeetingItems)
            .set({
              currentRevisionId: revision!.id,
              visible: true,
              changeStamp: input.action === 'SHARE' ? 0 : item.changeStamp + 1,
            })
            .where(eq(sharedMeetingItems.id, item.id));
        }
        await repo.advance(id, m.changeStamp);
        context.afterCommit('meeting.publication', () =>
          this.notify(
            id,
            input.action === 'SHARE'
              ? 'publication.created'
              : input.action === 'UPDATE'
                ? 'publication.updated'
                : 'publication.withdrawn',
          ),
        );
        return {
          reference: { kind: 'shared_meeting_item', id: item!.id },
          status: input.action === 'WITHDRAW' ? 'WITHDRAWN' : 'VISIBLE',
          changeStamp: m.changeStamp + 1,
        };
      },
    });
    return {
      id: result.result.result.reference.id,
      state: result.result.result.status,
      changeStamp: result.result.result.changeStamp,
      replayed: result.result.replayed,
    };
  }
}
