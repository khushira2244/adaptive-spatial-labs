import {
  requireMeetingKnowledge,
  type MeetingKnowledgePolicy,
} from './knowledge.meeting-policy.js';
import { validateSemanticScope } from './knowledge.scope.js';
import { eq } from 'drizzle-orm';
import { architectures } from '../architecture/architecture.schema.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import type { Principal } from '../../shared/auth/principal.js';
import type { Executor } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import type { SemanticScope } from './knowledge.input.js';

export async function architectureContext(
  db: Executor,
  principal: Principal,
  projectId: string,
  scope: SemanticScope,
  options: {
    snapshot?: boolean;
    read?: boolean;
    meetingId?: string;
    policy?: MeetingKnowledgePolicy | undefined;
  } = {},
) {
  if (options.meetingId) {
    const actual = await requireMeetingKnowledge(
      options.policy,
      db,
      principal,
      options.meetingId,
      scope.architectureId,
    );
    if (actual !== projectId)
      throw new AppError('DOMAIN_NOT_FOUND', 'Context outside Meeting scope.');
  } else await new ProjectAccess(db).read(principal, projectId);
  const repo = new ArchitectureRepository(db);
  const architecture = await repo.get(projectId, true);
  if (!architecture || architecture.id !== scope.architectureId)
    throw new AppError('DOMAIN_NOT_FOUND', 'Architecture context not found.');
  if (architecture.state === 'CANDIDATE')
    await new ProjectAccess(db).owner(principal, projectId, true);
  if (options.snapshot && architecture.state !== 'CONFIRMED')
    throw new AppError('INVALID_LIFECYCLE', 'Snapshots require a confirmed architecture.');
  if (options.read && scope.architectureStamp !== architecture.changeStamp) return 'STALE' as const;
  requireChangeStamp(architecture.changeStamp, scope.architectureStamp);
  const family = await repo.load(architecture.id);
  validateSemanticScope(family, scope);
  return 'CURRENT' as const;
}

/** Optional notebook/project filing is independent of the captured architecture's access scope. */
export async function contextProject(
  db: Executor,
  principal: Principal,
  scope: SemanticScope,
  assertedProjectId?: string | null,
  meetingId?: string | null,
  policy?: MeetingKnowledgePolicy,
) {
  const [row] = await db
    .select({ projectId: architectures.projectId })
    .from(architectures)
    .where(eq(architectures.id, scope.architectureId));
  if (!row || (assertedProjectId && row.projectId !== assertedProjectId))
    throw new AppError('DOMAIN_NOT_FOUND', 'Architecture context not found.');
  if (meetingId)
    await requireMeetingKnowledge(policy, db, principal, meetingId, scope.architectureId);
  else await new ProjectAccess(db).read(principal, row.projectId);
  return row.projectId;
}
