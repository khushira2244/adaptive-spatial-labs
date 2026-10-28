import {
  requireMeetingKnowledge,
  type MeetingKnowledgePolicy,
} from './knowledge.meeting-policy.js';
import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { requireRegisteredPrincipal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { requireProjectReferences } from '../project-sources/provenance.contract.js';
import { KnowledgeRepository } from './knowledge.repository.js';
import { architectureContext, contextProject } from './knowledge.context.js';
import type { Attachment } from './knowledge.input.js';
export async function privateAccess(
  db: Executor,
  principal: Principal,
  projectId?: string | null,
  meetingId?: string | null,
  policy?: MeetingKnowledgePolicy,
) {
  if (meetingId) {
    const allowedProject = await requireMeetingKnowledge(policy, db, principal, meetingId);
    if (projectId && allowedProject !== projectId)
      throw new AppError('DOMAIN_NOT_FOUND', 'Private scope not found.');
    return principal.actor;
  }
  const actor = requireRegisteredPrincipal(principal);
  await new PrincipalResolver(db).requireActive(principal);
  if (projectId) await new ProjectAccess(db).read(principal, projectId);
  return actor;
}
export async function validateAttachments(
  db: Executor,
  principal: Principal,
  projectId: string | null | undefined,
  attachments: Attachment[],
  read = false,
  meetingId?: string | null,
  policy?: MeetingKnowledgePolicy,
) {
  if (meetingId) {
    projectId = await requireMeetingKnowledge(policy, db, principal, meetingId);
  }
  if (attachments.length && !projectId)
    throw new AppError('VALIDATION_ERROR', 'Attachments require a project scope.');
  const statuses: ('CURRENT' | 'STALE')[] = [];
  for (const a of attachments) {
    if (a.kind === 'ARCHITECTURE')
      statuses.push(
        await architectureContext(db, principal, projectId!, a.scope, {
          read,
          ...(meetingId ? { meetingId, policy } : {}),
        }),
      );
    else if (a.kind === 'SOURCE_REFERENCE') {
      await new ProjectAccess(db).read(principal, projectId!);
      await requireProjectReferences(db, projectId!, [a.sourceReferenceId]);
      statuses.push('CURRENT');
    } else {
      const snapshot = await new KnowledgeRepository(db).snapshot(a.snapshotId, principal.actor);
      if (!snapshot || (snapshot.projectId && snapshot.projectId !== projectId))
        throw new AppError('DOMAIN_NOT_FOUND', 'Private reference not found.');
      await privateAccess(db, principal, snapshot.projectId, snapshot.meetingId, policy);
      await contextProject(db, principal, snapshot.scope, projectId, snapshot.meetingId, policy);
      await architectureContext(db, principal, projectId!, snapshot.scope, {
        ...(snapshot.meetingId ? { meetingId: snapshot.meetingId, policy } : {}),
        snapshot: true,
        read: true,
      });
      statuses.push('CURRENT');
    }
  }
  return statuses;
}
