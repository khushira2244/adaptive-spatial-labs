import { and, eq } from 'drizzle-orm';
import { projectEditors, users } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class EditorRepository {
  constructor(private db: Executor) {}
  async has(projectId: string, userId: string) {
    return (
      await this.db
        .select()
        .from(projectEditors)
        .where(and(eq(projectEditors.projectId, projectId), eq(projectEditors.userId, userId)))
    )[0];
  }
  list(projectId: string) {
    return this.db
      .select({
        projectId: projectEditors.projectId,
        userId: projectEditors.userId,
        addedByUserId: projectEditors.addedByUserId,
        createdAt: projectEditors.createdAt,
        fullName: users.fullName,
        designation: users.designation,
      })
      .from(projectEditors)
      .innerJoin(users, eq(users.id, projectEditors.userId))
      .where(eq(projectEditors.projectId, projectId))
      .orderBy(users.fullName);
  }
  async add(projectId: string, userId: string, addedByUserId: string) {
    return (
      await this.db.insert(projectEditors).values({ projectId, userId, addedByUserId }).returning()
    )[0]!;
  }
  async remove(projectId: string, userId: string) {
    return (
      await this.db
        .delete(projectEditors)
        .where(and(eq(projectEditors.projectId, projectId), eq(projectEditors.userId, userId)))
        .returning()
    )[0];
  }
}
