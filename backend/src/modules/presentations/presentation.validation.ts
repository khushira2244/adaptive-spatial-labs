import { z } from 'zod';
import { uuidIdentitySchema as uuid } from '../../shared/validation/uuid-identity.js';
import { semanticScopeSchema, snapshotPayloadSchema } from '../knowledge/knowledge.input.js';
import { requireProjectReferences } from '../project-sources/provenance.contract.js';
import { edgeVisual } from './presentation.input.js';
const actor = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('USER'), userId: uuid }).strict(),
  z.object({ kind: z.literal('SCOPED_GUEST'), guestId: uuid }).strict(),
]);
const safeInclusion = z.discriminatedUnion('kind', [
  z
    .object({
      id: uuid,
      kind: z.literal('KNOWLEDGE'),
      representation: z
        .object({
          category: z.enum(['NOTE', 'QUESTION', 'DISCUSSION_POINT']),
          title: z.string().min(1).max(200),
          body: z.string().min(1).max(16000),
          author: actor,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: uuid,
      kind: z.literal('SNAPSHOT'),
      representation: z
        .object({ scope: semanticScopeSchema, payload: snapshotPayloadSchema, creator: actor })
        .strict(),
    })
    .strict(),
  z
    .object({
      id: uuid,
      kind: z.literal('SOURCE_REFERENCE'),
      representation: z.object({ sourceReferenceId: uuid }).strict(),
    })
    .strict(),
]);
const safeOverlay = z
  .object({
    id: uuid,
    sourceNodeId: uuid,
    destinationNodeId: uuid,
    label: z.string().max(120),
    visual: edgeVisual,
  })
  .strict();
import type { Executor } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { requireChangeStamp } from '../../shared/concurrency/change-stamp.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import { validateSemanticScope } from '../knowledge/knowledge.scope.js';
import { draftSchema, type Draft, type Inclusion } from './presentation.input.js';
import type { Overlay } from './presentation.schema.js';
export async function validateDefinition(
  db: Executor,
  p: { projectId: string; architectureId: string },
  input: Draft,
  overlays: Overlay[],
  inclusions: Inclusion[],
) {
  const draft = draftSchema.parse(input),
    repo = new ArchitectureRepository(db),
    arch = await repo.get(p.projectId, true);
  if (!arch || arch.id !== p.architectureId || arch.state !== 'CONFIRMED')
    throw new AppError('INVALID_LIFECYCLE', 'Confirmed architecture is required.');
  if (draft.scope.architectureId !== arch.id)
    throw new AppError('VALIDATION_ERROR', 'Scope belongs to another architecture.');
  requireChangeStamp(arch.changeStamp, draft.scope.architectureStamp);
  const family = await repo.load(arch.id);
  validateSemanticScope(family, draft.scope);

  overlays = z.array(safeOverlay).max(128).parse(overlays);
  const safeInclusions = z.array(safeInclusion).max(32).parse(inclusions);
  for (const inclusion of safeInclusions) {
    if (inclusion.kind === 'SOURCE_REFERENCE')
      await requireProjectReferences(db, p.projectId, [inclusion.representation.sourceReferenceId]);
    if (inclusion.kind === 'SNAPSHOT') {
      const scope = inclusion.representation.scope;
      if (scope.architectureId !== arch.id)
        throw new AppError('VALIDATION_ERROR', 'Included capture belongs to another architecture.');
      requireChangeStamp(arch.changeStamp, scope.architectureStamp);
      validateSemanticScope(family, scope);
    }
  }
  inclusions = safeInclusions;

  const graph = family.graphs.find((g) => g.id === draft.scope.architectureGraphRef)!;
  const unique = (ids: string[]) => {
    if (new Set(ids).size !== ids.length)
      throw new AppError('VALIDATION_ERROR', 'Duplicate presentation target.');
  };
  unique(draft.nodeOverrides.map((o) => o.nodeId));
  unique(draft.connectionOverrides.map((o) => o.connectionId));
  unique(overlays.map((o) => o.id));
  unique(inclusions.map((o) => o.id));
  for (const o of draft.nodeOverrides)
    if (!graph.nodes.some((n) => n.id === o.nodeId))
      throw new AppError('VALIDATION_ERROR', 'Invalid node override target.');
  for (const o of draft.connectionOverrides)
    if (!graph.connections.some((e) => e.id === o.connectionId))
      throw new AppError('VALIDATION_ERROR', 'Invalid connection override target.');
  if (overlays.length > 128 || inclusions.length > 32)
    throw new AppError('VALIDATION_ERROR', 'Screen definition exceeds bounds.');
  for (const o of overlays)
    if (
      !graph.nodes.some((n) => n.id === o.sourceNodeId) ||
      !graph.nodes.some((n) => n.id === o.destinationNodeId)
    )
      throw new AppError('VALIDATION_ERROR', 'Invalid scenario endpoint.');
  return { draft, overlays, inclusions };
}
