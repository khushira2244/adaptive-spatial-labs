import { and, eq } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { AppError } from '../../shared/errors/app-error.js';
import { meetings, meetingParticipants } from './meeting.schema.js';
export const missing = () => new AppError('DOMAIN_NOT_FOUND', 'Meeting resource not found.');
export async function meetingAccess(db: Executor, principal: Principal, id: string, owner = false) {
  const scope =
    principal.actor.kind === 'SCOPED_GUEST' ? { kind: 'MEETING' as const, id } : undefined;
  await new PrincipalResolver(db).requireActive(principal, scope);
  const [m] = await db.select().from(meetings).where(eq(meetings.id, id)).for('update');
  if (!m) throw missing();
  const [p] = await db
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
  if (!p || p.state !== 'ADMITTED') throw missing();
  if (owner && (principal.actor.kind !== 'USER' || m.ownerId !== principal.actor.userId))
    throw new AppError('DOMAIN_FORBIDDEN', 'Meeting owner authority required.');
  await new PrincipalResolver(db).requireActive(principal, scope);
  return { meeting: m, participant: p };
}
export function requireLive(state: string) {
  if (state !== 'LIVE') throw new AppError('INVALID_LIFECYCLE', 'Meeting is not live.');
}
