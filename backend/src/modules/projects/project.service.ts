import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { ProjectRepository } from './project.repository.js';
import { ProjectAuthorization } from './project.authorization.js';
import { projectDto } from './project.types.js';
import type { projectPatch, projectQuery } from './project.schema.js';
export class ProjectService {
  constructor(
    private db: Database,
    private repository: ProjectRepository,
    private authorization: ProjectAuthorization,
  ) {}
  async list(userId: string, query: z.infer<typeof projectQuery>) {
    return (await this.repository.list(userId, query.status, query.limit, query.offset)).map(
      projectDto,
    );
  }
  async get(id: string, userId: string) {
    return projectDto((await this.authorization.requireProjectAccess(id, userId)).project);
  }
  update(id: string, userId: string, patch: z.infer<typeof projectPatch>) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectOwner(id, userId, true);
      return projectDto(await new ProjectRepository(tx).update(id, patch));
    });
  }
}
