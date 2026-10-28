import { and, eq } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import {
  meetings,
  meetingParticipants,
  meetingShared,
  presenterTransfers,
  participantPrivate,
} from './meeting.schema.js';
import { meetingAccess, requireLive, missing } from './meeting.access.js';
import { MeetingRepository } from './meeting.repository.js';
import { validateMeetingScope } from './meeting.validation.js';
import type { MeetingCommand, checkpoint } from './meeting.input.js';
import type { Notify } from './meeting.service.js';
import type { z } from 'zod';
export class MeetingControl {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private notify: Notify = async () => {},
  ) {}
  async command(
    principal: Principal,
    id: string,
    input: Exclude<MeetingCommand, { action: 'START' | 'END' | 'SETUP' }>,
  ) {
    const owner = input.action === 'TAKE_BACK' || input.action === 'REVOKE';
    const result = await this.writes.run({
      principal,
      ...(principal.actor.kind === 'SCOPED_GUEST'
        ? { invitedScope: { kind: 'MEETING' as const, id } }
        : {}),
      operation: {
        id: input.operationId,
        commandKind: 'meeting.control',
        scope: { kind: 'meeting', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await meetingAccess(tx, principal, id, owner);
      },
      execute: async (context) => {
        const { tx } = context,
          { meeting: m, participant: p } = await meetingAccess(tx, principal, id, owner),
          repo = new MeetingRepository(tx);
        requireLive(m.state);
        requireChangeStamp(m.changeStamp, input.expectedStamp);
        const shared = await repo.shared(id),
          state = structuredClone(shared.state),
          snapshot = await repo.snapshot(id);
        const isPresenter = state.presenterParticipantId === p.id;
        if (['NAVIGATE', 'FOCUS', 'REQUEST_TRANSFER'].includes(input.action)) {
          if (!isPresenter)
            throw new AppError(
              'DOMAIN_FORBIDDEN',
              'Only the current presenter controls navigation.',
            );
          if ('authorityGeneration' in input)
            requireChangeStamp(state.authorityGeneration, input.authorityGeneration);
        }
        if (input.action === 'NAVIGATE') {
          const screen = snapshot.payload.screens.find((s) => s.id === input.screenId);
          if (!screen) throw new AppError('VALIDATION_ERROR', 'Screen is outside start snapshot.');
          state.screenId = screen.id;
          state.focus = screen.definition.draft.scope;
        }
        if (input.action === 'FOCUS') {
          await validateMeetingScope(
            tx,
            m.projectId,
            snapshot.payload,
            input.scope,
            state.screenId,
          );
          state.focus = input.scope;
        }
        if (input.action === 'REQUEST_TRANSFER') {
          const [target] = await tx
            .select()
            .from(meetingParticipants)
            .where(
              and(
                eq(meetingParticipants.id, input.targetParticipantId),
                eq(meetingParticipants.meetingId, id),
                eq(meetingParticipants.state, 'ADMITTED'),
              ),
            );
          if (!target || target.id === p.id)
            throw new AppError('VALIDATION_ERROR', 'Choose one other admitted participant.');
          const pending = await tx
            .select()
            .from(presenterTransfers)
            .where(
              and(eq(presenterTransfers.meetingId, id), eq(presenterTransfers.state, 'PENDING')),
            );
          if (pending.length)
            throw new AppError('DOMAIN_CONFLICT', 'One presenter transfer is already pending.');
          const [r] = await tx
            .insert(presenterTransfers)
            .values({
              meetingId: id,
              requesterParticipantId: p.id,
              targetParticipantId: target.id,
              authorityGeneration: state.authorityGeneration,
              state: 'PENDING',
            })
            .returning();
          await repo.advance(id, m.changeStamp);
          context.afterCommit('meeting.transfer', () =>
            this.notify(id, 'presenter.transfer.requested'),
          );
          return {
            reference: { kind: 'presenter_transfer', id: r!.id },
            status: 'PENDING',
            changeStamp: m.changeStamp + 1,
          };
        }
        if (input.action === 'ACCEPT_TRANSFER' || input.action === 'DECLINE_TRANSFER') {
          const [r] = await tx
            .select()
            .from(presenterTransfers)
            .where(
              and(eq(presenterTransfers.id, input.requestId), eq(presenterTransfers.meetingId, id)),
            )
            .for('update');
          if (!r || r.targetParticipantId !== p.id) throw missing();
          if (r.state !== 'PENDING')
            throw new AppError('INVALID_LIFECYCLE', 'Transfer is not pending.');
          requireChangeStamp(state.authorityGeneration, r.authorityGeneration);
          if (state.presenterParticipantId !== r.requesterParticipantId)
            throw new AppError('STALE_CHANGE_STAMP', 'Presenter authority changed.');
          await tx
            .update(presenterTransfers)
            .set({ state: input.action === 'ACCEPT_TRANSFER' ? 'ACCEPTED' : 'DECLINED' })
            .where(eq(presenterTransfers.id, r.id));
          if (input.action === 'ACCEPT_TRANSFER') {
            state.presenterParticipantId = p.id;
            state.authorityGeneration++;
          }
        }
        if (input.action === 'TAKE_BACK') {
          const [ownerRow] = await tx
            .select()
            .from(meetingParticipants)
            .where(
              and(eq(meetingParticipants.meetingId, id), eq(meetingParticipants.userId, m.ownerId)),
            );
          state.presenterParticipantId = ownerRow!.id;
          state.authorityGeneration++;
          await repo.cancelTransfers(id);
        }
        if (input.action === 'LEAVE' || input.action === 'REVOKE') {
          const targetId = input.action === 'LEAVE' ? p.id : input.participantId;
          const [target] = await tx
            .select()
            .from(meetingParticipants)
            .where(
              and(eq(meetingParticipants.id, targetId), eq(meetingParticipants.meetingId, id)),
            );
          if (!target) throw missing();
          if (input.action === 'REVOKE' && target.userId === m.ownerId)
            throw new AppError('DOMAIN_FORBIDDEN', 'Owner admission cannot be revoked.');
          await tx
            .update(meetingParticipants)
            .set({
              state:
                target.userId === m.ownerId
                  ? 'ADMITTED'
                  : input.action === 'LEAVE'
                    ? 'LEFT'
                    : 'REVOKED',
              connected: false,
            })
            .where(eq(meetingParticipants.id, target.id));
          if (target.id === state.presenterParticipantId && target.userId !== m.ownerId) {
            const [ownerRow] = await tx
              .select()
              .from(meetingParticipants)
              .where(
                and(
                  eq(meetingParticipants.meetingId, id),
                  eq(meetingParticipants.userId, m.ownerId),
                ),
              );
            state.presenterParticipantId = ownerRow!.id;
            state.authorityGeneration++;
          }
          await repo.cancelTransfers(id);
        }
        await tx.update(meetingShared).set({ state }).where(eq(meetingShared.meetingId, id));
        await repo.advance(id, m.changeStamp);
        context.afterCommit('meeting.control', () =>
          this.notify(
            id,
            input.action === 'NAVIGATE'
              ? 'shared.screen.changed'
              : input.action === 'FOCUS'
                ? 'shared.focus.changed'
                : input.action === 'TAKE_BACK'
                  ? 'presenter.takeback'
                  : input.action === 'ACCEPT_TRANSFER'
                    ? 'presenter.transfer.accepted'
                    : input.action === 'DECLINE_TRANSFER'
                      ? 'presenter.transfer.declined'
                      : 'participant.left',
          ),
        );
        return {
          reference: { kind: 'meeting', id },
          status: 'LIVE',
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
  async private(
    principal: Principal,
    id: string,
    input?: z.infer<typeof checkpoint>,
    returnLive = false,
  ) {
    return this.db.transaction(async (tx) => {
      const { meeting: m, participant: p } = await meetingAccess(tx, principal, id);
      const repo = new MeetingRepository(tx),
        shared = await repo.shared(id);
      const [existing] = await tx
        .select()
        .from(participantPrivate)
        .where(eq(participantPrivate.participantId, p.id))
        .for('update');
      if (input || returnLive) {
        requireLive(m.state);
        const saved = returnLive ? { following: true, screenId: shared.state.screenId } : input!;
        const snapshot = await repo.snapshot(id);
        if (!snapshot.payload.screens.some((s) => s.id === saved.screenId))
          throw new AppError('VALIDATION_ERROR', 'Private screen is outside start snapshot.');
        if ('scope' in saved && saved.scope)
          await validateMeetingScope(tx, m.projectId, snapshot.payload, saved.scope);
        if (input) requireChangeStamp(existing?.changeStamp ?? 0, input.expectedStamp);
        const value = {
          following: saved.following,
          screenId: saved.screenId,
          ...('scope' in saved && saved.scope ? { scope: saved.scope } : {}),
        };
        if (existing)
          await tx
            .update(participantPrivate)
            .set({
              checkpoint: value,
              changeStamp: existing.changeStamp + 1,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(participantPrivate.participantId, p.id),
                eq(participantPrivate.changeStamp, existing.changeStamp),
              ),
            );
        else
          await tx
            .insert(participantPrivate)
            .values({ participantId: p.id, checkpoint: value, changeStamp: 1 });
      }
      const [current] = await tx
        .select()
        .from(participantPrivate)
        .where(eq(participantPrivate.participantId, p.id));
      await meetingAccess(tx, principal, id);
      return {
        participantId: p.id,
        checkpoint: current?.checkpoint ?? null,
        changeStamp: current?.changeStamp ?? 0,
        ...(returnLive ? { shared: shared.state, meetingStamp: m.changeStamp } : {}),
      };
    });
  }
}
