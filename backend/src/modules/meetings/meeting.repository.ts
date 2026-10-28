import { and, eq } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { ActorRef } from '../../shared/auth/principal.js';
import { requireChangedRow, advanceChangeStamp } from '../../shared/concurrency/change-stamp.js';
import {
  meetings,
  meetingParticipants,
  meetingSnapshots,
  meetingShared,
  presenterTransfers,
} from './meeting.schema.js';
import { missing } from './meeting.access.js';
export class MeetingRepository {
  constructor(private db: Executor) {}
  async snapshot(id: string) {
    const [s] = await this.db
      .select()
      .from(meetingSnapshots)
      .where(eq(meetingSnapshots.meetingId, id));
    if (!s) throw missing();
    return s;
  }
  async shared(id: string) {
    const [s] = await this.db.select().from(meetingShared).where(eq(meetingShared.meetingId, id));
    if (!s) throw missing();
    return s;
  }
  async ensureParticipant(id: string, actor: ActorRef) {
    const existing = await this.db
      .select()
      .from(meetingParticipants)
      .where(
        and(
          eq(meetingParticipants.meetingId, id),
          actor.kind === 'USER'
            ? eq(meetingParticipants.userId, actor.userId)
            : eq(meetingParticipants.guestId, actor.guestId),
        ),
      );
    if (existing[0]) return existing[0];
    const [p] = await this.db
      .insert(meetingParticipants)
      .values({
        meetingId: id,
        ...(actor.kind === 'USER' ? { userId: actor.userId } : { guestId: actor.guestId }),
        state: 'ADMITTED',
      })
      .returning();
    return p!;
  }
  async advance(id: string, stamp: number, state?: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED') {
    const [row] = await this.db
      .update(meetings)
      .set({
        changeStamp: advanceChangeStamp(stamp, stamp),
        updatedAt: new Date(),
        ...(state ? { state } : {}),
      })
      .where(and(eq(meetings.id, id), eq(meetings.changeStamp, stamp)))
      .returning();
    return requireChangedRow(row);
  }
  async cancelTransfers(id: string) {
    await this.db
      .update(presenterTransfers)
      .set({ state: 'CANCELLED' })
      .where(and(eq(presenterTransfers.meetingId, id), eq(presenterTransfers.state, 'PENDING')));
  }
}
