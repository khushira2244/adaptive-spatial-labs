import { eq, and, isNull } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { AppError } from '../../shared/errors/app-error.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { PresentationRepository } from '../presentations/presentation.repository.js';
import { presentationAccess } from '../presentations/presentation.access.js';
import { screenDefinitions } from '../presentations/presentation.schema.js';
import { validateDefinition } from '../presentations/presentation.validation.js';
import {
  meetings,
  meetingSnapshots,
  meetingShared,
  meetingParticipants,
  frozenCaptures,
  sharedMeetingItems,
  type CapturedScreen,
} from './meeting.schema.js';
import { meetingAccess, requireLive, missing } from './meeting.access.js';
import { MeetingRepository } from './meeting.repository.js';
import { bounded } from './meeting.validation.js';
import type { z } from 'zod';
import type { createMeeting } from './meeting.input.js';
export type Notify = (id: string, event: string) => Promise<void>;
export class MeetingService {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private notify: Notify = async () => {},
  ) {}
  async create(principal: Principal, input: z.infer<typeof createMeeting>) {
    const result = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'meeting.create',
        scope: { kind: 'project', id: input.projectId },
      },
      semanticRequest: input,
      authorize: async ({ tx }, previous) => {
        await new ProjectAccess(tx).owner(principal, input.projectId);
        if (previous) await meetingAccess(tx, principal, previous.reference.id, true);
      },
      execute: async ({ tx }) => {
        const { presentation: p } = await presentationAccess(
          tx,
          principal,
          input.presentationId,
          'OWNER',
        );
        if (p.projectId !== input.projectId)
          throw new AppError('VALIDATION_ERROR', 'Presentation belongs to another Project.');
        const screens = await new PresentationRepository(tx).screens(p.id);
        if (!screens.some((s) => s.id === input.startFromScreenId))
          throw new AppError('VALIDATION_ERROR', 'Invalid Start From screen.');
        const actor = requireRegisteredPrincipal(principal);
        const [m] = await tx
          .insert(meetings)
          .values({
            projectId: p.projectId,
            presentationId: p.id,
            ownerId: actor.userId,
            title: input.title,
            startFromScreenId: input.startFromScreenId,
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            state: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          })
          .returning();
        await new MeetingRepository(tx).ensureParticipant(m!.id, actor);
        return { reference: { kind: 'meeting', id: m!.id }, status: m!.state, changeStamp: 0 };
      },
    });
    return {
      id: result.result.result.reference.id,
      state: result.result.result.status,
      changeStamp: 0,
      replayed: result.result.replayed,
    };
  }
  async lifecycle(
    principal: Principal,
    id: string,
    input: {
      operationId: string;
      expectedStamp: number;
      action: 'START' | 'END' | 'SETUP';
      title?: string;
      startFromScreenId?: string;
      scheduledAt?: string | null;
    },
  ) {
    const result = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'meeting.' + input.action.toLowerCase(),
        scope: { kind: 'meeting', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await meetingAccess(tx, principal, id, true);
      },
      execute: async (context) => {
        const { tx } = context,
          { meeting: m } = await meetingAccess(tx, principal, id, true),
          repo = new MeetingRepository(tx);
        requireChangeStamp(m.changeStamp, input.expectedStamp);
        let reference = { kind: 'meeting', id },
          state = m.state;
        if (input.action === 'SETUP') {
          if (!['DRAFT', 'SCHEDULED'].includes(m.state))
            throw new AppError('INVALID_LIFECYCLE', 'Setup is frozen after start.');
          const screens = await new PresentationRepository(tx).screens(m.presentationId);
          if (!screens.some((s) => s.id === input.startFromScreenId))
            throw new AppError('VALIDATION_ERROR', 'Invalid start screen.');
          await tx
            .update(meetings)
            .set({
              title: input.title!,
              startFromScreenId: input.startFromScreenId!,
              scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            })
            .where(eq(meetings.id, id));
          state = input.scheduledAt ? 'SCHEDULED' : 'DRAFT';
        }
        if (input.action === 'START') {
          if (!['DRAFT', 'SCHEDULED'].includes(m.state))
            throw new AppError('INVALID_LIFECYCLE', 'Meeting already started.');
          const { presentation: p } = await presentationAccess(
            tx,
            principal,
            m.presentationId,
            'OWNER',
          );
          if (p.projectId !== m.projectId)
            throw new AppError('VALIDATION_ERROR', 'Presentation binding mismatch.');
          const screens = await new PresentationRepository(tx).screens(p.id),
            captured: CapturedScreen[] = [];
          for (const s of screens)
            if (s.state === 'CONFIRMED' && s.lastDefinitionId) {
              const [d] = await tx
                .select()
                .from(screenDefinitions)
                .where(
                  and(
                    eq(screenDefinitions.id, s.lastDefinitionId),
                    eq(screenDefinitions.screenId, s.id),
                  ),
                );
              if (!d) throw missing();
              const definition = await validateDefinition(
                tx,
                p,
                d.definition.draft,
                d.definition.overlays,
                d.definition.inclusions,
              );
              captured.push({ id: s.id, definitionId: d.id, definition });
            }
          if (
            captured.filter((s) => s.definition.draft.type === 'MAIN_ARCHITECTURE').length !== 1 ||
            !captured.some((s) => s.id === m.startFromScreenId)
          )
            throw new AppError(
              'INVALID_LIFECYCLE',
              'Start From must be a current confirmed screen.',
            );
          const payload = { architectureId: p.architectureId, screens: captured };
          bounded(payload);
          const [snapshot] = await tx
            .insert(meetingSnapshots)
            .values({ meetingId: id, payload })
            .returning();
          const owner = await repo.ensureParticipant(id, { kind: 'USER', userId: m.ownerId });
          await tx
            .update(meetingParticipants)
            .set({ state: 'ADMITTED' })
            .where(eq(meetingParticipants.id, owner.id));
          const start = captured.find((s) => s.id === m.startFromScreenId)!;
          await tx.insert(meetingShared).values({
            meetingId: id,
            snapshotId: snapshot!.id,
            state: {
              screenId: start.id,
              focus: start.definition.draft.scope,
              presenterParticipantId: owner.id,
              authorityGeneration: 0,
            },
          });
          await repo.cancelTransfers(id);
          reference = { kind: 'meeting_snapshot', id: snapshot!.id };
          state = 'LIVE';
        }
        if (input.action === 'END') {
          requireLive(m.state);
          const snapshot = await repo.snapshot(id),
            shared = await repo.shared(id);
          const publications = await tx
            .select()
            .from(sharedMeetingItems)
            .where(and(eq(sharedMeetingItems.meetingId, id), eq(sharedMeetingItems.visible, true)));
          const participants = await tx
            .select()
            .from(meetingParticipants)
            .where(eq(meetingParticipants.meetingId, id));
          const payload = {
            snapshotId: snapshot.id,
            publications: publications.map((i) => ({
              publicationId: i.id,
              revisionId: i.currentRevisionId!,
            })),
            shared: shared.state,
            participants: participants.map((p) => ({
              id: p.id,
              actor: p.userId
                ? { kind: 'USER' as const, userId: p.userId }
                : { kind: 'SCOPED_GUEST' as const, guestId: p.guestId! },
            })),
          };
          bounded(payload);
          const [capture] = await tx
            .insert(frozenCaptures)
            .values({ meetingId: id, payload })
            .returning();
          reference = { kind: 'frozen_meeting_capture', id: capture!.id };
          await repo.cancelTransfers(id);
          state = 'ENDED';
        }
        await repo.advance(id, m.changeStamp, state);
        context.afterCommit('meeting.lifecycle', () =>
          this.notify(
            id,
            input.action === 'END'
              ? 'meeting.ended'
              : input.action === 'START'
                ? 'meeting.started'
                : 'meeting.setup',
          ),
        );
        return { reference, status: state, changeStamp: m.changeStamp + 1 };
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
