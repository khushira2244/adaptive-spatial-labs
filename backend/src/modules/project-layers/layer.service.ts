import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ProjectAuthorization } from '../projects/project.authorization.js';
import { LayerRepository } from './layer.repository.js';
import type { layerInput, layerPatch } from './layer.schema.js';
export class LayerService {
  constructor(
    private db: Database,
    private repository: LayerRepository,
    private authorization: ProjectAuthorization,
  ) {}
  async list(projectId: string, userId: string) {
    await this.authorization.requireProjectAccess(projectId, userId);
    return this.repository.list(projectId);
  }
  add(projectId: string, userId: string, input: z.infer<typeof layerInput>) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(projectId, userId);
      const repo = new LayerRepository(tx);
      const current = await repo.list(projectId);
      if (current.length >= 100)
        throw new AppError('VALIDATION_ERROR', 'A project supports up to 100 layers.');
      const layer = await repo.add({ ...input, projectId, source: 'USER_CREATED' });
      const ids = current.map((l) => l.id);
      ids.splice(Math.min(input.sortOrder, ids.length), 0, layer.id);
      await repo.order(projectId, ids);
      return (await repo.list(projectId)).find((l) => l.id === layer.id)!;
    });
  }
  update(projectId: string, id: string, userId: string, patch: z.infer<typeof layerPatch>) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(projectId, userId);
      const repo = new LayerRepository(tx);
      const current = await repo.list(projectId);
      if (!current.some((l) => l.id === id))
        throw new AppError('LAYER_NOT_FOUND', 'Layer not found.');
      const { sortOrder, ...properties } = patch;
      await repo.update(projectId, id, properties);
      if (sortOrder !== undefined) {
        const ids = current.filter((l) => l.id !== id).map((l) => l.id);
        ids.splice(Math.min(sortOrder, ids.length), 0, id);
        await repo.order(projectId, ids);
      }
      return (await repo.list(projectId)).find((l) => l.id === id)!;
    });
  }
  remove(projectId: string, id: string, userId: string) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(projectId, userId);
      const repo = new LayerRepository(tx);
      if (!(await repo.remove(projectId, id)))
        throw new AppError('LAYER_NOT_FOUND', 'Layer not found.');
      await repo.order(
        projectId,
        (await repo.list(projectId)).map((l) => l.id),
      );
      return { removed: true };
    });
  }
}
