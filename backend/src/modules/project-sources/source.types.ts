import type { projectSources } from '../../shared/database/schema.js';
export function sourceDto(source: typeof projectSources.$inferSelect) {
  return {
    id: source.id,
    projectId: source.projectId,
    sourceType: source.sourceType,
    name: source.name,
    status: source.status,
    hasFile: source.storageKey !== null,
    externalReference: source.externalReference,
    metadata: source.metadata ?? { contentType: null, byteSize: null, note: null },
    addedByUserId: source.addedByUserId,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}
