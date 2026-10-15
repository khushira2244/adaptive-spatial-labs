import { and, eq } from 'drizzle-orm';
import { projectSources, stagedUploads } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class SourceRepository {
  constructor(private db: Executor) {}
  list(projectId: string) {
    return this.db
      .select()
      .from(projectSources)
      .where(eq(projectSources.projectId, projectId))
      .orderBy(projectSources.createdAt, projectSources.id);
  }
  async get(projectId: string, id: string) {
    return (
      await this.db
        .select()
        .from(projectSources)
        .where(and(eq(projectSources.projectId, projectId), eq(projectSources.id, id)))
    )[0];
  }
  async add(input: typeof projectSources.$inferInsert) {
    return (await this.db.insert(projectSources).values(input).returning())[0]!;
  }
  async remove(projectId: string, id: string) {
    return (
      await this.db
        .delete(projectSources)
        .where(and(eq(projectSources.projectId, projectId), eq(projectSources.id, id)))
        .returning()
    )[0];
  }
  async stage(input: typeof stagedUploads.$inferInsert) {
    return (await this.db.insert(stagedUploads).values(input).returning())[0]!;
  }
  async staged(id: string) {
    return (
      await this.db.select().from(stagedUploads).where(eq(stagedUploads.id, id)).for('update')
    )[0];
  }
  async consume(id: string) {
    await this.db.delete(stagedUploads).where(eq(stagedUploads.id, id));
  }
}
