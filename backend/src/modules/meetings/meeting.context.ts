import { eq } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { AppError } from '../../shared/errors/app-error.js';
import { meetingAccess } from './meeting.access.js';
import { meetingSnapshots } from './meeting.schema.js';
export async function meetingArchitecture(
  db: Executor,
  principal: Principal,
  meetingId: string,
  architectureId: string,
) {
  const { meeting } = await meetingAccess(db, principal, meetingId);
  const [snapshot] = await db
    .select()
    .from(meetingSnapshots)
    .where(eq(meetingSnapshots.meetingId, meetingId));
  if (!snapshot || snapshot.payload.architectureId !== architectureId)
    throw new AppError(
      'DOMAIN_NOT_FOUND',
      'Architecture is outside the admitted Meeting snapshot.',
    );
  return meeting.projectId;
}
export async function meetingKnowledgePolicy(
  db: Executor,
  principal: Principal,
  meetingId: string,
  architectureId?: string,
) {
  const { meeting } = await meetingAccess(db, principal, meetingId);
  if (architectureId) await meetingArchitecture(db, principal, meetingId, architectureId);
  return meeting.projectId;
}
