import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { AppError } from '../../shared/errors/app-error.js';
/** Supplied only by server composition; Knowledge does not depend on Meeting services. */
export type MeetingKnowledgePolicy = (
  db: Executor,
  principal: Principal,
  meetingId: string,
  architectureId?: string,
) => Promise<string>;
export async function requireMeetingKnowledge(
  policy: MeetingKnowledgePolicy | undefined,
  db: Executor,
  principal: Principal,
  meetingId: string,
  architectureId?: string,
) {
  if (!policy) throw new AppError('DOMAIN_NOT_FOUND', 'Private Meeting scope is unavailable.');
  return policy(db, principal, meetingId, architectureId);
}
