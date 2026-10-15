import type { projects } from '../../shared/database/schema.js';
export function projectDto(project: typeof projects.$inferSelect) {
  return {
    id: project.id,
    organizationId: project.organizationId,
    name: project.name,
    description: project.description,
    projectType: project.projectType,
    visibility: project.visibility,
    ownerUserId: project.ownerUserId,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
