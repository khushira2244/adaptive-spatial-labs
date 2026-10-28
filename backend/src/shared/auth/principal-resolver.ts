import { decodeJwt } from 'jose';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthService } from '../../modules/auth/auth.service.js';
import type { Executor } from '../database/client.js';
import { refreshSessions } from '../database/schema.js';
import { scopedGuestAccess } from '../database/foundation-schema.js';
import { AppError } from '../errors/app-error.js';
import { uuidIdentitySchema } from '../validation/uuid-identity.js';
import { guestAccessState, guestAttribution, guestTokenDigest } from './guest-access.js';
import {
  invitedScopeSchema,
  requirePrincipal,
  verifiedPrincipal,
  type InvitedScope,
  type Principal,
} from './principal.js';

const identitySchema = z
  .object({ userId: uuidIdentitySchema, sessionId: uuidIdentitySchema })
  .strict();
const deny = () => new AppError('DOMAIN_UNAUTHORIZED', 'Authentication is no longer valid.');

/** A verified AuthService identity or a verified guest bearer credential is the only ingress.
 * No client role, workspace mode, title or ActorRef is accepted as authentication.
 */
export class PrincipalResolver {
  constructor(private readonly db: Executor) {}

  async registered(auth: AuthService, token: string, now?: Date): Promise<Principal> {
    const verified = identitySchema.parse(
      await auth.authenticate(z.string().min(1).max(8192).parse(token)),
    );
    // Signature/issuer/audience were already verified by AuthService; retain credential expiry for queued/cached use.
    const accessExpiresAt = z.number().int().positive().parse(decodeJwt(token).exp) * 1000;
    const principal = verifiedPrincipal(
      { kind: 'USER', userId: verified.userId },
      { kind: 'USER_SESSION', sessionId: verified.sessionId, accessExpiresAt },
    );
    await this.requireActive(principal, undefined, now);
    return principal;
  }

  async guest(token: string, expectedScope: InvitedScope, now?: Date): Promise<Principal> {
    const scope = invitedScopeSchema.parse(expectedScope);
    // Token has 256 random bits; hashing is safe here (not a human password).
    const [access] = await this.db
      .select()
      .from(scopedGuestAccess)
      .where(eq(scopedGuestAccess.tokenDigest, guestTokenDigest(token)))
      .for('share');
    // Default time is sampled AFTER the potentially blocking read. Explicit now is a test override.
    const checkedAt = now ?? new Date();
    if (
      !access ||
      guestAccessState(access, checkedAt) !== 'ACTIVE' ||
      access.scopeKind !== scope.kind ||
      access.scopeId !== scope.id
    )
      throw deny();
    return verifiedPrincipal(guestAttribution(access), { kind: 'GUEST_ACCESS' });
  }

  async requireActive(
    principal: Principal,
    expectedScope?: InvitedScope,
    now?: Date,
  ): Promise<void> {
    const { actor, credential } = requirePrincipal(principal);
    if (actor.kind === 'USER' && credential.kind === 'USER_SESSION') {
      if (credential.accessExpiresAt <= (now ?? new Date()).getTime()) throw deny();
      // SHARE lock inside command transaction serializes logout/revocation against command commit.
      const [session] = await this.db
        .select()
        .from(refreshSessions)
        .where(eq(refreshSessions.id, credential.sessionId))
        .for('share');
      const checkedAt = now ?? new Date();
      if (
        !session ||
        session.userId !== actor.userId ||
        session.revokedAt ||
        session.expiresAt <= checkedAt ||
        credential.accessExpiresAt <= checkedAt.getTime()
      )
        throw deny();
      return;
    }
    if (actor.kind !== 'SCOPED_GUEST' || credential.kind !== 'GUEST_ACCESS') throw deny();
    const scope = expectedScope ? invitedScopeSchema.parse(expectedScope) : undefined;
    const [access] = await this.db
      .select()
      .from(scopedGuestAccess)
      .where(eq(scopedGuestAccess.id, actor.guestId))
      .for('share');
    const checkedAt = now ?? new Date();
    // For guests a command MUST supply its actual invited scope, not a claimed project scope.
    if (
      !access ||
      !scope ||
      guestAccessState(access, checkedAt) !== 'ACTIVE' ||
      access.scopeKind !== scope.kind ||
      access.scopeId !== scope.id
    )
      throw deny();
  }
}
