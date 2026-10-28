import { and, eq } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { GuestAccess } from '../../shared/auth/guest-access.js';
import { CommandTransactions } from '../../shared/database/command-transaction.js';
import type { IdempotentOperations } from '../../shared/operations/idempotent-operation.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { AppError } from '../../shared/errors/app-error.js';
import { users } from '../../shared/database/schema.js';
import { meetings, meetingParticipants, meetingInvitations } from './meeting.schema.js';
import { meetingAccess, missing } from './meeting.access.js';
import { MeetingRepository } from './meeting.repository.js';
import type { Notify } from './meeting.service.js';
import type { inviteMeeting, respondMeeting } from './meeting.input.js';
import type { z } from 'zod';
export class MeetingAdmission {
  constructor(
    private db: Database,
    private writes: IdempotentOperations,
    private notify: Notify = async () => {},
  ) {}
  async invite(principal: Principal, id: string, input: z.infer<typeof inviteMeeting>) {
    const result = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'meeting.invite',
        scope: { kind: 'meeting', id },
      },
      semanticRequest: input,
      authorize: async ({ tx }) => {
        await meetingAccess(tx, principal, id, true);
      },
      execute: async ({ tx }) => {
        const { meeting: m } = await meetingAccess(tx, principal, id, true);
        if (m.state === 'ENDED') throw new AppError('INVALID_LIFECYCLE', 'Meeting ended.');
        requireChangeStamp(m.changeStamp, input.expectedStamp);
        const invites = await tx
          .select()
          .from(meetingInvitations)
          .where(eq(meetingInvitations.meetingId, id));
        if (invites.length >= 200)
          throw new AppError('DOMAIN_CONFLICT', 'Invitation bound reached.');
        if (
          invites.some(
            (i) => i.email === input.email && i.state === 'PENDING' && i.expiresAt > new Date(),
          )
        )
          throw new AppError('DOMAIN_CONFLICT', 'Invitation pending.');
        const [i] = await tx
          .insert(meetingInvitations)
          .values({
            meetingId: id,
            email: input.email,
            state: 'PENDING',
            expiresAt: new Date(Date.now() + input.expiresInDays * 86400000),
          })
          .returning();
        await new MeetingRepository(tx).advance(id, m.changeStamp);
        return {
          reference: { kind: 'meeting_invitation', id: i!.id },
          status: 'PENDING',
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
  async respond(
    principal: Principal,
    id: string,
    invitationId: string,
    input: z.infer<typeof respondMeeting>,
  ) {
    const result = await this.writes.run({
      principal,
      operation: {
        id: input.operationId,
        commandKind: 'meeting.invitation.respond',
        scope: { kind: 'meeting', id },
      },
      semanticRequest: { invitationId, input },
      authorize: async ({ tx }) => {
        const actor = requireRegisteredPrincipal(principal),
          [i] = await tx
            .select()
            .from(meetingInvitations)
            .where(
              and(eq(meetingInvitations.id, invitationId), eq(meetingInvitations.meetingId, id)),
            );
        if (!i) throw missing();
        if (input.action === 'CANCEL') await meetingAccess(tx, principal, id, true);
        else {
          const [u] = await tx
            .select({ email: users.normalizedEmail })
            .from(users)
            .where(eq(users.id, actor.userId));
          if (u?.email !== i.email) throw missing();
        }
      },
      execute: async (context) => {
        const { tx } = context,
          [m] = await tx.select().from(meetings).where(eq(meetings.id, id)).for('update');
        if (!m) throw missing();
        if (m.state === 'ENDED') throw new AppError('INVALID_LIFECYCLE', 'Meeting ended.');
        const [i] = await tx
          .select()
          .from(meetingInvitations)
          .where(eq(meetingInvitations.id, invitationId))
          .for('update');
        if (!i || i.state !== 'PENDING')
          throw new AppError('INVALID_LIFECYCLE', 'Invitation is not pending.');
        let state: 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED' =
          input.action === 'ACCEPT'
            ? 'ACCEPTED'
            : input.action === 'DECLINE'
              ? 'DECLINED'
              : 'CANCELLED';
        if (i.expiresAt <= new Date()) state = 'EXPIRED';
        let participantId: string | null = null;
        if (state === 'ACCEPTED') {
          const repo = new MeetingRepository(tx),
            participant = await repo.ensureParticipant(id, requireRegisteredPrincipal(principal));
          if (participant.state === 'REVOKED')
            throw new AppError('DOMAIN_FORBIDDEN', 'Admission revoked.');
          await tx
            .update(meetingParticipants)
            .set({ state: 'ADMITTED' })
            .where(eq(meetingParticipants.id, participant.id));
          participantId = participant.id;
        }
        await tx
          .update(meetingInvitations)
          .set({ state, acceptedParticipantId: participantId })
          .where(eq(meetingInvitations.id, i.id));
        await new MeetingRepository(tx).advance(id, m.changeStamp);
        context.afterCommit('meeting.admission', () => this.notify(id, 'participant.admitted'));
        return {
          reference: { kind: 'meeting_invitation', id: invitationId },
          status: state,
          changeStamp: m.changeStamp + 1,
        };
      },
    });
    return {
      id: invitationId,
      state: result.result.result.status,
      replayed: result.result.replayed,
    };
  }
  async join(principal: Principal, id: string, operationId: string) {
    const scope =
      principal.actor.kind === 'SCOPED_GUEST' ? { kind: 'MEETING' as const, id } : undefined;
    const result = await this.writes.run({
      principal,
      ...(scope ? { invitedScope: scope } : {}),
      operation: { id: operationId, commandKind: 'meeting.join', scope: { kind: 'meeting', id } },
      semanticRequest: { id },
      authorize: async ({ tx }) => {
        await new PrincipalResolver(tx).requireActive(principal, scope);
        const [p] = await tx
          .select()
          .from(meetingParticipants)
          .where(
            and(
              eq(meetingParticipants.meetingId, id),
              principal.actor.kind === 'USER'
                ? eq(meetingParticipants.userId, principal.actor.userId)
                : eq(meetingParticipants.guestId, principal.actor.guestId),
            ),
          );
        if (!p || p.state === 'REVOKED') throw missing();
      },
      execute: async (context) => {
        const { tx } = context,
          [m] = await tx.select().from(meetings).where(eq(meetings.id, id)).for('update');
        if (!m) throw missing();
        if (m.state === 'ENDED') throw new AppError('INVALID_LIFECYCLE', 'Meeting ended.');
        const p = await new MeetingRepository(tx).ensureParticipant(id, principal.actor);
        if (p.state === 'REVOKED') throw missing();
        await tx
          .update(meetingParticipants)
          .set({ state: 'ADMITTED' })
          .where(eq(meetingParticipants.id, p.id));
        await new MeetingRepository(tx).advance(id, m.changeStamp);
        context.afterCommit('meeting.join', () => this.notify(id, 'participant.joined'));
        return {
          reference: { kind: 'meeting_participant', id: p.id },
          status: 'ADMITTED',
          changeStamp: m.changeStamp + 1,
        };
      },
    });
    return { id: result.result.result.reference.id, replayed: result.result.replayed };
  }
  /** Trusted owner-authorized admission; no email-token redemption or fake User creation. */
  async guest(principal: Principal, id: string, expiresAt: Date) {
    return (
      await new CommandTransactions(this.db).run(async (context) => {
        const { tx } = context,
          { meeting: m } = await meetingAccess(tx, principal, id, true);
        if (m.state === 'ENDED') throw new AppError('INVALID_LIFECYCLE', 'Meeting ended.');
        if (
          !Number.isFinite(expiresAt.getTime()) ||
          expiresAt.getTime() > Date.now() + 30 * 86400000
        )
          throw new AppError('VALIDATION_ERROR', 'Guest validity is bounded to thirty days.');
        const count = await tx
          .select({ id: meetingParticipants.id })
          .from(meetingParticipants)
          .where(eq(meetingParticipants.meetingId, id));
        if (count.length >= 256)
          throw new AppError('DOMAIN_CONFLICT', 'Participant bound reached.');
        const issued = await new GuestAccess(tx).provision({ kind: 'MEETING', id }, expiresAt),
          p = await new MeetingRepository(tx).ensureParticipant(id, issued.actor);
        await new MeetingRepository(tx).advance(id, m.changeStamp);
        await new PrincipalResolver(tx).requireActive(principal);
        context.afterCommit('meeting.guest', () => this.notify(id, 'participant.admitted'));
        return { participantId: p.id, actor: issued.actor, token: issued.token };
      })
    ).result;
  }
}
