import { z } from 'zod';

/** Canonical application spelling of PostgreSQL UUID identity, not arbitrary semantic text. */
export const uuidIdentitySchema = z.uuid().transform((value) => value.toLowerCase());

export function sameUuidIdentity(left: string, right: string): boolean {
  const a = uuidIdentitySchema.safeParse(left);
  const b = uuidIdentitySchema.safeParse(right);
  return a.success && b.success && a.data === b.data;
}
