import { z } from 'zod';
import { uuidIdentitySchema, sameUuidIdentity } from '../validation/uuid-identity.js';
import { AppError } from '../errors/app-error.js';

export const invitedScopeSchema = z
  .object({
    kind: z.enum(['PRESENTATION', 'MEETING']),
    id: uuidIdentitySchema,
  })
  .strict();
export type InvitedScope = Readonly<z.infer<typeof invitedScopeSchema>>;
export type ActorRef = Readonly<
  { kind: 'USER'; userId: string } | { kind: 'SCOPED_GUEST'; guestId: string }
>;
const verified = Symbol('server-verified-principal');
export type Principal = Readonly<{
  actor: ActorRef;
  credential: Readonly<
    { kind: 'USER_SESSION'; sessionId: string; accessExpiresAt: number } | { kind: 'GUEST_ACCESS' }
  >;
  [verified]: true;
}>;

// Internal minting is deliberately not an HTTP parser. Resolver calls this only after credential validation.
export function verifiedPrincipal(actor: ActorRef, credential: Principal['credential']): Principal {
  return Object.freeze({
    actor: Object.freeze(
      actor.kind === 'USER'
        ? { kind: 'USER' as const, userId: uuidIdentitySchema.parse(actor.userId) }
        : { kind: 'SCOPED_GUEST' as const, guestId: uuidIdentitySchema.parse(actor.guestId) },
    ),
    credential: Object.freeze(
      credential.kind === 'USER_SESSION'
        ? { ...credential, sessionId: uuidIdentitySchema.parse(credential.sessionId) }
        : credential,
    ),
    [verified]: true as const,
  });
}
export function requirePrincipal(principal: Principal | null | undefined): Principal {
  if (!principal || principal[verified] !== true)
    throw new AppError('DOMAIN_UNAUTHORIZED', 'Authentication required.');
  return principal;
}
export function requireRegisteredPrincipal(
  principal: Principal | null | undefined,
): Extract<ActorRef, { kind: 'USER' }> {
  const { actor } = requirePrincipal(principal);
  if (actor.kind !== 'USER')
    throw new AppError('DOMAIN_FORBIDDEN', 'A registered user is required.');
  return actor;
}
export function sameActor(left: ActorRef, right: ActorRef): boolean {
  return (
    left.kind === right.kind &&
    (left.kind === 'USER'
      ? sameUuidIdentity(left.userId, (right as Extract<ActorRef, { kind: 'USER' }>).userId)
      : sameUuidIdentity(
          left.guestId,
          (right as Extract<ActorRef, { kind: 'SCOPED_GUEST' }>).guestId,
        ))
  );
}
