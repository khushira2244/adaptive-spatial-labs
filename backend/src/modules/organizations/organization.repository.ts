import { and, eq, ilike, or } from 'drizzle-orm';
import { organizations, organizationMembers, users } from '../../shared/database/schema.js';
import type { Executor } from '../../shared/database/client.js';
export class OrganizationRepository {
  constructor(private db: Executor) {}
  async find(id: string) {
    return (await this.db.select().from(organizations).where(eq(organizations.id, id)))[0];
  }
  async membership(organizationId: string, userId: string) {
    return (
      await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId),
          ),
        )
    )[0];
  }
  list(userId: string) {
    return this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        membershipRole: organizationMembers.membershipRole,
      })
      .from(organizations)
      .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, userId));
  }
  async create(name: string, userId: string) {
    const [organization] = await this.db.insert(organizations).values({ name }).returning();
    if (!organization) throw new Error('Organization insert failed');
    await this.db
      .insert(organizationMembers)
      .values({ organizationId: organization.id, userId, membershipRole: 'OWNER' });
    return organization;
  }
  members(organizationId: string, search: string, limit: number, offset: number) {
    const escaped = search.replace(/[\\%_]/g, '\\$&');
    return this.db
      .select({
        id: users.id,
        fullName: users.fullName,
        workEmail: users.workEmail,
        designation: users.designation,
        teamDepartment: users.teamDepartment,
        membershipRole: organizationMembers.membershipRole,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          or(ilike(users.fullName, `%${escaped}%`), ilike(users.workEmail, `%${escaped}%`)),
        ),
      )
      .orderBy(users.fullName, users.id)
      .limit(limit)
      .offset(offset);
  }
}
