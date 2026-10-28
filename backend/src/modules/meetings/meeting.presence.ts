import { and, eq } from 'drizzle-orm';
import type { Database } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { CommandTransactions } from '../../shared/database/command-transaction.js';
import { meetings, meetingParticipants, meetingShared } from './meeting.schema.js';
import { meetingAccess, requireLive } from './meeting.access.js';
import { MeetingRepository } from './meeting.repository.js';
import type { Notify } from './meeting.service.js';
export class MeetingPresence {
  constructor(
    private db: Database,
    private notify: Notify = async () => {},
  ) {}
  async connect(principal: Principal, id: string) {
    return (
      await new CommandTransactions(this.db).run(async (context) => {
        const { tx } = context,
          { meeting: m, participant: p } = await meetingAccess(tx, principal, id);
        requireLive(m.state);
        const epoch = p.connectionEpoch + 1;
        await tx
          .update(meetingParticipants)
          .set({ connected: true, connectionEpoch: epoch })
          .where(eq(meetingParticipants.id, p.id));
        await new MeetingRepository(tx).advance(id, m.changeStamp);
        const shared = await new MeetingRepository(tx).shared(id);
        context.afterCommit('meeting.presence', () => this.notify(id, 'participant.presence'));
        await meetingAccess(tx, principal, id);
        return { participantId: p.id, epoch, generation: shared.state.authorityGeneration };
      })
    ).result;
  }
  /** Server-only socket lease/generation signal. Never accepted in a client command schema. */
  async disconnect(id: string, participantId: string, epoch: number, generation: number) {
    return (
      await new CommandTransactions(this.db).run(async (context) => {
        const { tx } = context,
          [m] = await tx.select().from(meetings).where(eq(meetings.id, id)).for('update');
        if (!m) return false;
        const [p] = await tx
          .select()
          .from(meetingParticipants)
          .where(
            and(eq(meetingParticipants.id, participantId), eq(meetingParticipants.meetingId, id)),
          )
          .for('update');
        if (!p || p.connectionEpoch !== epoch) return false;
        await tx
          .update(meetingParticipants)
          .set({ connected: false })
          .where(eq(meetingParticipants.id, p.id));
        if (m.state !== 'LIVE') return false;
        const repo = new MeetingRepository(tx),
          shared = await repo.shared(id),
          state = structuredClone(shared.state);
        const fallback =
          state.presenterParticipantId === p.id &&
          p.userId !== m.ownerId &&
          state.authorityGeneration === generation;
        if (fallback) {
          const [owner] = await tx
            .select()
            .from(meetingParticipants)
            .where(
              and(eq(meetingParticipants.meetingId, id), eq(meetingParticipants.userId, m.ownerId)),
            );
          state.presenterParticipantId = owner!.id;
          state.authorityGeneration++;
          await repo.cancelTransfers(id);
          await tx.update(meetingShared).set({ state }).where(eq(meetingShared.meetingId, id));
        }
        await repo.advance(id, m.changeStamp);
        context.afterCommit('meeting.presence', () =>
          this.notify(id, fallback ? 'presenter.fallback' : 'participant.presence'),
        );
        return fallback;
      })
    ).result;
  }
  /** Single-instance startup: no old socket lease survives this server process. */
  async recover() {
    const rows = await this.db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.state, 'LIVE'));
    for (const { id } of rows)
      await new CommandTransactions(this.db).run(async ({ tx }) => {
        const [m] = await tx.select().from(meetings).where(eq(meetings.id, id)).for('update');
        if (!m || m.state !== 'LIVE') return;
        const repo = new MeetingRepository(tx),
          shared = await repo.shared(id),
          state = structuredClone(shared.state);
        const [owner] = await tx
          .select()
          .from(meetingParticipants)
          .where(
            and(eq(meetingParticipants.meetingId, id), eq(meetingParticipants.userId, m.ownerId)),
          );
        if (!owner) throw new Error('Live owner participant missing.');
        await tx
          .update(meetingParticipants)
          .set({ connected: false })
          .where(eq(meetingParticipants.meetingId, id));
        state.presenterParticipantId = owner.id;
        state.authorityGeneration++;
        await repo.cancelTransfers(id);
        await tx.update(meetingShared).set({ state }).where(eq(meetingShared.meetingId, id));
        await repo.advance(id, m.changeStamp);
      });
  }
}
