import type { Database } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ProjectAuthorization } from '../projects/project.authorization.js';
import { OrganizationRepository } from '../organizations/organization.repository.js';
import { EditorRepository } from './editor.repository.js';
export class EditorService {
  constructor(
    private db: Database,
    private repository: EditorRepository,
    private authorization: ProjectAuthorization,
  ) {}
  async list(id: string, userId: string) {
    await this.authorization.requireProjectAccess(id, userId);
    return this.repository.list(id);
  }
  add(id: string, userId: string, editorId: string) {
    return this.db.transaction(async (tx) => {
      const { project } = await new ProjectAuthorization(tx, true).requireProjectOwner(id, userId);
      const repo = new EditorRepository(tx);
      if (project.ownerUserId === editorId || (await repo.has(id, editorId)))
        throw new AppError('EDITOR_ALREADY_EXISTS', 'User already has project authoring access.');
      if (!(await new OrganizationRepository(tx).membership(project.organizationId, editorId)))
        throw new AppError(
          'ORGANIZATION_FORBIDDEN',
          'Editors must belong to the project organization.',
        );
      return repo.add(id, editorId, userId);
    });
  }
  remove(id: string, userId: string, editorId: string) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectOwner(id, userId);
      if (!(await new EditorRepository(tx).remove(id, editorId)))
        throw new AppError('EDITOR_NOT_FOUND', 'Editor not found.');
      return { removed: true };
    });
  }
}
