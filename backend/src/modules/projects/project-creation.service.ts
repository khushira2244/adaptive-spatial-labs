import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { OrganizationRepository } from '../organizations/organization.repository.js';
import { EditorRepository } from '../project-editors/editor.repository.js';
import { StructureRepository } from '../project-structure/structure.repository.js';
import { templateLayers } from '../project-structure/templates/templates.js';
import { LayerRepository } from '../project-layers/layer.repository.js';
import { attachSource } from '../project-sources/source.attach.js';
import { ProjectRepository } from './project.repository.js';
import { projectDto } from './project.types.js';
import type { createProjectSchema } from './project.schema.js';
export class ProjectCreationService {
  constructor(private db: Database) {}
  create(userId: string, input: z.infer<typeof createProjectSchema>) {
    return this.db.transaction(async (tx) => {
      const organizations = new OrganizationRepository(tx);
      if (!(await organizations.find(input.organizationId)))
        throw new AppError('ORGANIZATION_NOT_FOUND', 'Organization not found.');
      if (!(await organizations.membership(input.organizationId, userId)))
        throw new AppError('ORGANIZATION_FORBIDDEN', 'Organization membership is required.');
      const project = await new ProjectRepository(tx).create({
        name: input.name,
        description: input.description,
        organizationId: input.organizationId,
        projectType: input.projectType,
        visibility: input.visibility,
        ownerUserId: userId,
        status: 'ACTIVE',
      });
      for (const editorId of input.editorUserIds) {
        if (editorId === userId)
          throw new AppError('EDITOR_ALREADY_EXISTS', 'The creator already owns the project.');
        if (!(await organizations.membership(input.organizationId, editorId)))
          throw new AppError(
            'ORGANIZATION_FORBIDDEN',
            'Editors must belong to the project organization.',
          );
        await new EditorRepository(tx).add(project.id, editorId, userId);
      }
      await new StructureRepository(tx).set(project.id, input.structure.templateKey);
      const layers = input.structure.layers ?? templateLayers(input.structure.templateKey);
      for (const [sortOrder, layer] of [...layers]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .entries())
        await new LayerRepository(tx).add({ ...layer, projectId: project.id, sortOrder });
      // Deterministic locking prevents concurrent creation commands deadlocking on shared uploads.
      for (const source of [...input.sources].sort((a, b) =>
        (a.uploadId ?? '').localeCompare(b.uploadId ?? ''),
      ))
        await attachSource(tx, project.id, userId, source);
      return projectDto(project);
    });
  }
}
