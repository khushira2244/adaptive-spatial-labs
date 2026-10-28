import { randomBytes, createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { uuidIdentitySchema } from '../validation/uuid-identity.js';
import type { Executor } from '../database/client.js';
import { scopedGuestAccess } from '../database/foundation-schema.js';
import { AppError } from '../errors/app-error.js';
import { invitedScopeSchema, type InvitedScope, type ActorRef } from './principal.js';

const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export function guestTokenDigest(token: string): string {
  return createHash('sha256').update(tokenSchema.parse(token)).digest('hex');
}
export type GuestAccessRecord = typeof scopedGuestAccess.$inferSelect;
export function guestAccessState(
  access: GuestAccessRecord,
  now = new Date(),
): 'ACTIVE' | 'EXPIRED' | 'REVOKED' {
  if (access.revokedAt) return 'REVOKED';
  return access.expiresAt <= now ? 'EXPIRED' : 'ACTIVE';
}
export function guestAttribution(access: GuestAccessRecord): ActorRef {
  return Object.freeze({ kind: 'SCOPED_GUEST', guestId: access.id });
}

/** Internal persistence only: later invitation owner must authorize/validate parent scope first. */
export class GuestAccess {
  constructor(private readonly db: Executor) {}
  async provision(scope: InvitedScope, expiresAt: Date, now = new Date()) {
    const validated = invitedScopeSchema.parse(scope);
    z.date().parse(expiresAt);
    if (expiresAt <= now)
      throw new AppError('INVALID_LIFECYCLE', 'Guest access must expire in the future.');
    const token = randomBytes(32).toString('hex');
    const [access] = await this.db
      .insert(scopedGuestAccess)
      .values({
        scopeKind: validated.kind,
        scopeId: validated.id,
        tokenDigest: guestTokenDigest(token),
        expiresAt,
        createdAt: now,
      })
      .returning();
    if (!access) throw new Error('Guest access insert failed');
    // Token is returned once to the trusted invitation use case, never stored or logged.
    return { actor: guestAttribution(access), access, token };
  }
  async revoke(guestId: string, now = new Date()): Promise<void> {
    await this.db
      .update(scopedGuestAccess)
      .set({ revokedAt: now })
      .where(eq(scopedGuestAccess.id, uuidIdentitySchema.parse(guestId)));
  }
}
