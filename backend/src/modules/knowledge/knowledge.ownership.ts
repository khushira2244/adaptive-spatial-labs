import { and, eq } from 'drizzle-orm';
import type { ActorRef } from '../../shared/auth/principal.js';
import { sameActor } from '../../shared/auth/principal.js';
import { AppError } from '../../shared/errors/app-error.js';
import { knowledgeItems, snapshots } from './knowledge.schema.js';
type Owned = { userId: string | null; guestId: string | null };
export function authorRef(row: Owned): ActorRef {
  if (row.userId && !row.guestId) return { kind: 'USER', userId: row.userId };
  if (row.guestId && !row.userId) return { kind: 'SCOPED_GUEST', guestId: row.guestId };
  throw new AppError('DOMAIN_NOT_FOUND', 'Private resource not found.');
}
export function requirePrivateOwner(row: Owned, actor: ActorRef) {
  if (!sameActor(authorRef(row), actor))
    throw new AppError('DOMAIN_NOT_FOUND', 'Private resource not found.');
}
export function ownedBy(table: typeof knowledgeItems | typeof snapshots, actor: ActorRef) {
  return and(
    eq(table.visibility, 'PRIVATE'),
    actor.kind === 'USER' ? eq(table.userId, actor.userId) : eq(table.guestId, actor.guestId),
  );
}
