import { eq } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { meetings } from '../meetings/meeting.schema.js';
import { meetingReviews } from './outcome.schema.js';
export const missing = () => new AppError('DOMAIN_NOT_FOUND', 'Outcome resource not found.');
export async function ownerMeeting(db: Executor, principal: Principal, id: string) {
  const actor = requireRegisteredPrincipal(principal);
  const [m] = await db.select().from(meetings).where(eq(meetings.id, id));
  if (!m) throw missing();
  await new ProjectAccess(db).owner(principal, m.projectId);
  if (m.ownerId !== actor.userId)
    throw new AppError('DOMAIN_FORBIDDEN', 'Meeting owner authority required.');
  if (m.state !== 'ENDED')
    throw new AppError('INVALID_LIFECYCLE', 'End the Meeting before review.');
  return m;
}
export async function reviewAccess(db: Executor, principal: Principal, id: string, write = false) {
  const [r] = await db.select().from(meetingReviews).where(eq(meetingReviews.id, id)).for('update');
  if (!r) throw missing();
  if (write || r.state !== 'SAVED') await ownerMeeting(db, principal, r.meetingId);
  else await new ProjectAccess(db).read(principal, r.projectId);
  return r;
}
