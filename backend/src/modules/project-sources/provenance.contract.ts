import { and, eq, inArray } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import { projectSources } from '../../shared/database/schema.js';
import { sourceReferences } from './provenance.schema.js';
import { AppError } from '../../shared/errors/app-error.js';
/** Architecture depends only on exact provenance identities, never provider credentials or source bodies. */
export async function requireProjectReferences(db: Executor, projectId: string, ids: string[]) {
  if (!ids.length) return;
  const rows = await db
    .select({ id: sourceReferences.id })
    .from(sourceReferences)
    .innerJoin(projectSources, eq(projectSources.id, sourceReferences.sourceId))
    .where(
      and(eq(projectSources.projectId, projectId), inArray(sourceReferences.id, [...new Set(ids)])),
    );
  if (rows.length !== new Set(ids).size)
    throw new AppError('DOMAIN_NOT_FOUND', 'Source reference not found.');
}
