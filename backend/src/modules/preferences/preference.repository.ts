import { eq } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import { userPreferences, type Preferences } from '../../shared/database/schema.js';
export class PreferenceRepository {
  constructor(private db: Executor) {}
  async read(userId: string) {
    return (
      await this.db.select().from(userPreferences).where(eq(userPreferences.userId, userId))
    )[0];
  }
  async initialize(userId: string, preferences: Preferences) {
    await this.db.insert(userPreferences).values({ userId, preferences }).onConflictDoNothing();
  }
  async lock(userId: string) {
    return (
      await this.db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .for('update')
    )[0];
  }
  async write(userId: string, preferences: Preferences) {
    await this.db
      .update(userPreferences)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId));
  }
}
