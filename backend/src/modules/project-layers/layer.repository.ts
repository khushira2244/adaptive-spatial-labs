import { and, eq, asc } from 'drizzle-orm';
import { projectLayers } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class LayerRepository {
  constructor(private db: Executor) {}
  list(projectId: string) {
    return this.db
      .select()
      .from(projectLayers)
      .where(eq(projectLayers.projectId, projectId))
      .orderBy(asc(projectLayers.sortOrder), projectLayers.id);
  }
  async add(value: typeof projectLayers.$inferInsert) {
    return (await this.db.insert(projectLayers).values(value).returning())[0]!;
  }
  async update(
    projectId: string,
    id: string,
    patch: Partial<{
      [K in keyof typeof projectLayers.$inferInsert]:
        (typeof projectLayers.$inferInsert)[K] | undefined;
    }>,
  ) {
    return (
      await this.db
        .update(projectLayers)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(projectLayers.projectId, projectId), eq(projectLayers.id, id)))
        .returning()
    )[0];
  }
  async remove(projectId: string, id: string) {
    return (
      await this.db
        .delete(projectLayers)
        .where(and(eq(projectLayers.projectId, projectId), eq(projectLayers.id, id)))
        .returning()
    )[0];
  }
  clear(projectId: string) {
    return this.db.delete(projectLayers).where(eq(projectLayers.projectId, projectId));
  }
  async order(projectId: string, ids: string[]) {
    for (const [sortOrder, id] of ids.entries()) await this.update(projectId, id, { sortOrder });
  }
}
