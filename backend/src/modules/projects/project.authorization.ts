import type { Executor } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { OrganizationRepository } from '../organizations/organization.repository.js';
import { EditorRepository } from '../project-editors/editor.repository.js';
import { ProjectRepository } from './project.repository.js';
export class ProjectAuthorization {
  constructor(
    private db: Executor,
    private lock = false,
  ) {}
  async role(projectId: string, userId: string) {
    const project = await new ProjectRepository(this.db).find(projectId, this.lock);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', 'Project not found.');
    const member = await new OrganizationRepository(this.db).membership(
      project.organizationId,
      userId,
    );
    const owner = member && project.ownerUserId === userId;
    const editor = member && !!(await new EditorRepository(this.db).has(projectId, userId));
    return {
      project,
      member: !!member,
      role: owner ? ('OWNER' as const) : editor ? ('EDITOR' as const) : null,
    };
  }
  async requireProjectAccess(projectId: string, userId: string) {
    const result = await this.role(projectId, userId);
    if (!result.role && !(result.member && result.project.visibility === 'ORGANIZATION_OPEN'))
      throw new AppError('PROJECT_FORBIDDEN', 'You do not have access to this project.');
    return result;
  }
  async requireProjectOwner(projectId: string, userId: string, allowArchived = false) {
    const result = await this.role(projectId, userId);
    if (result.role !== 'OWNER')
      throw new AppError('PROJECT_FORBIDDEN', 'Only the project owner can perform this operation.');
    if (!allowArchived) this.requireActive(result.project.status);
    return result;
  }
  async requireProjectEditorOrOwner(projectId: string, userId: string) {
    const result = await this.role(projectId, userId);
    if (!result.role)
      throw new AppError('PROJECT_FORBIDDEN', 'Project authoring access is required.');
    this.requireActive(result.project.status);
    return result;
  }
  private requireActive(status: string) {
    if (status !== 'ACTIVE')
      throw new AppError('PROJECT_INVALID_STATE', 'Archived projects are read-only.');
  }
}
