import { and, eq, isNull } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import type { Principal } from '../../shared/auth/principal.js';
import { PrincipalResolver } from '../../shared/auth/principal-resolver.js';
import { ProjectAccess } from '../../shared/auth/authorization.js';
import { AppError } from '../../shared/errors/app-error.js';
import { presentations, presentationGrants } from './presentation.schema.js';
export const missing = () => new AppError('DOMAIN_NOT_FOUND', 'Presentation resource not found.');
export async function presentationAccess(
  db: Executor,
  principal: Principal,
  id: string,
  level: 'READ' | 'EDIT' | 'OWNER' = 'READ',
) {
  await new PrincipalResolver(db).requireActive(
    principal,
    principal.actor.kind === 'SCOPED_GUEST' ? { kind: 'PRESENTATION', id } : undefined,
  );
  const [p] = await db.select().from(presentations).where(eq(presentations.id, id)).for('update');
  if (!p) throw missing();
  if (principal.actor.kind === 'USER' && p.ownerId === principal.actor.userId) {
    await new ProjectAccess(db).owner(principal, p.projectId, true);
    return { presentation: p, role: 'OWNER' as const };
  }
  const [grant] = await db
    .select()
    .from(presentationGrants)
    .where(
      and(
        eq(presentationGrants.presentationId, id),
        isNull(presentationGrants.revokedAt),
        principal.actor.kind === 'USER'
          ? eq(presentationGrants.userId, principal.actor.userId)
          : eq(presentationGrants.guestId, principal.actor.guestId),
      ),
    )
    .for('share');
  if (!grant) throw missing();
  await new PrincipalResolver(db).requireActive(
    principal,
    principal.actor.kind === 'SCOPED_GUEST' ? { kind: 'PRESENTATION', id } : undefined,
  );
  if (level === 'OWNER' || (level === 'EDIT' && grant.role !== 'COLLABORATOR'))
    throw new AppError('DOMAIN_FORBIDDEN', 'Presentation authority is required.');
  return { presentation: p, role: grant.role };
}
