import { and, eq, gt, isNull } from 'drizzle-orm';
import { refreshSessions, users } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
import type { z } from 'zod';
import type { signupSchema } from './auth.schema.js';
export class AuthRepository {
  constructor(private db: Executor) {}
  async byEmail(email: string) {
    return (await this.db.select().from(users).where(eq(users.normalizedEmail, email)))[0];
  }
  async createUser(input: z.infer<typeof signupSchema>, passwordHash: string) {
    const [user] = await this.db
      .insert(users)
      .values({
        fullName: input.fullName,
        workEmail: input.workEmail,
        normalizedEmail: input.workEmail.trim().toLowerCase(),
        passwordHash,
        designation: input.designation,
        teamDepartment: input.teamDepartment,
      })
      .returning();
    if (!user) throw new Error('User insert failed');
    return user;
  }
  async createSession(userId: string, tokenHash: string, expiresAt: Date, id: string) {
    await this.db.insert(refreshSessions).values({ id, userId, tokenHash, expiresAt });
  }
  async session(id: string) {
    return (await this.db.select().from(refreshSessions).where(eq(refreshSessions.id, id)))[0];
  }
  async rotate(id: string, oldHash: string, tokenHash: string, expiresAt: Date) {
    return (
      await this.db
        .update(refreshSessions)
        .set({ tokenHash, expiresAt, updatedAt: new Date() })
        .where(
          and(
            eq(refreshSessions.id, id),
            eq(refreshSessions.tokenHash, oldHash),
            isNull(refreshSessions.revokedAt),
            gt(refreshSessions.expiresAt, new Date()),
          ),
        )
        .returning()
    )[0];
  }
  async revoke(id: string, tokenHash: string) {
    return (
      await this.db
        .update(refreshSessions)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(refreshSessions.id, id),
            eq(refreshSessions.tokenHash, tokenHash),
            isNull(refreshSessions.revokedAt),
          ),
        )
        .returning()
    )[0];
  }
}
