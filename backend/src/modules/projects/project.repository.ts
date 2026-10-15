import { and, eq, exists, or, ne, sql, desc } from 'drizzle-orm';
import { projects, organizationMembers, projectEditors } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class ProjectRepository {
  constructor(private db: Executor) {}
  async find(id: string, lock = false) {
    const query = this.db.select().from(projects).where(eq(projects.id, id));
    return (await (lock ? query.for('update') : query))[0];
  }
  async create(input: typeof projects.$inferInsert) {
    const [project] = await this.db.insert(projects).values(input).returning();
    if (!project) throw new Error('Project insert failed');
    return project;
  }
  async update(
    id: string,
    patch: Partial<{
      [K in keyof typeof projects.$inferInsert]: (typeof projects.$inferInsert)[K] | undefined;
    }>,
  ) {
    return (
      await this.db
        .update(projects)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning()
    )[0]!;
  }
  list(userId: string, status: 'ACTIVE' | 'ARCHIVED', limit: number, offset: number) {
    const member = exists(
      this.db
        .select({ one: sql`1` })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, projects.organizationId),
            eq(organizationMembers.userId, userId),
          ),
        ),
    );
    const editor = exists(
      this.db
        .select({ one: sql`1` })
        .from(projectEditors)
        .where(and(eq(projectEditors.projectId, projects.id), eq(projectEditors.userId, userId))),
    );
    return this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.status, status),
          member,
          or(eq(projects.ownerUserId, userId), editor, ne(projects.visibility, 'RESTRICTED')),
        ),
      )
      .orderBy(desc(projects.updatedAt), projects.id)
      .limit(limit)
      .offset(offset);
  }
}
