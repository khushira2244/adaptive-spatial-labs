import { AppError } from '../../shared/errors/app-error.js';
import type { Executor } from '../../shared/database/client.js';
import { ArchitectureRepository } from '../architecture/architecture.repository.js';
import { validateSemanticScope } from '../knowledge/knowledge.scope.js';
import type { SemanticScope } from '../knowledge/knowledge.input.js';
import type { StartPayload } from './meeting.schema.js';
export function bounded(value: unknown, max = 2097152) {
  if (Buffer.byteLength(JSON.stringify(value)) > max)
    throw new AppError('VALIDATION_ERROR', 'Meeting content exceeds its bounded payload.');
}
export async function validateMeetingScope(
  db: Executor,
  projectId: string,
  snapshot: StartPayload,
  scope: SemanticScope,
  screenId?: string,
) {
  const repo = new ArchitectureRepository(db),
    arch = await repo.get(projectId, true);
  if (
    !arch ||
    arch.id !== snapshot.architectureId ||
    scope.architectureId !== arch.id ||
    scope.architectureStamp !== arch.changeStamp ||
    arch.state !== 'CONFIRMED'
  )
    throw new AppError('VALIDATION_ERROR', 'Context is outside the frozen Meeting architecture.');
  const family = await repo.load(arch.id);
  validateSemanticScope(family, scope);
  if (screenId) {
    const screen = snapshot.screens.find((s) => s.id === screenId);
    if (!screen) throw new AppError('VALIDATION_ERROR', 'Screen is outside the start snapshot.');
    const base = screen.definition.draft.scope;
    if (scope.architectureGraphRef !== base.architectureGraphRef)
      throw new AppError('VALIDATION_ERROR', 'Focus is outside the selected screen.');
    if (base.kind === 'LASSO_GROUP') {
      const selected =
        scope.kind === 'NODE'
          ? [scope.nodeRef]
          : scope.kind === 'LASSO_GROUP'
            ? scope.selectedNodeRefs
            : [];
      if (!selected.length || selected.some((n) => !base.selectedNodeRefs.includes(n)))
        throw new AppError('VALIDATION_ERROR', 'Focus is outside the selected area.');
    }
  }
}
