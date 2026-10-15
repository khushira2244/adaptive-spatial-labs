import type { Database } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { OrganizationRepository } from './organization.repository.js';
export class OrganizationService {
  constructor(
    private db: Database,
    private repository: OrganizationRepository,
  ) {}
  async requireMember(id: string, userId: string) {
    if (!(await this.repository.find(id)))
      throw new AppError('ORGANIZATION_NOT_FOUND', 'Organization not found.');
    if (!(await this.repository.membership(id, userId)))
      throw new AppError('ORGANIZATION_FORBIDDEN', 'Organization membership is required.');
  }
  list(userId: string) {
    return this.repository.list(userId);
  }
  create(name: string, userId: string) {
    return this.db.transaction((tx) => new OrganizationRepository(tx).create(name, userId));
  }
  async members(id: string, userId: string, search: string, limit: number, offset: number) {
    await this.requireMember(id, userId);
    return this.repository.members(id, search, limit, offset);
  }
}
