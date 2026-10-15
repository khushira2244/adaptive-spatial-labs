import { eq } from 'drizzle-orm';
import { projectStructures } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class StructureRepository {
  constructor(private db: Executor) {}
  async get(projectId: string) {
    return (
      await this.db
        .select()
        .from(projectStructures)
        .where(eq(projectStructures.projectId, projectId))
    )[0]!;
  }
  async set(projectId: string, templateKey: typeof projectStructures.$inferInsert.templateKey) {
    return (
      await this.db
        .insert(projectStructures)
        .values({ projectId, templateKey })
        .onConflictDoUpdate({
          target: projectStructures.projectId,
          set: { templateKey, updatedAt: new Date() },
        })
        .returning()
    )[0]!;
  }
}
