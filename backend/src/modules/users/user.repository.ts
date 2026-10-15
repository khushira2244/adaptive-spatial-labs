import { eq } from 'drizzle-orm';
import { users } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
import type { z } from 'zod';
import type { profileSchema } from './user.schema.js';
export class UserRepository {
  constructor(private db: Executor) {}
  async find(id: string) {
    return (await this.db.select().from(users).where(eq(users.id, id)))[0];
  }
  async update(id: string, input: z.infer<typeof profileSchema>) {
    return (
      await this.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()
    )[0];
  }
}
