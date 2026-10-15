import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import { ProjectAuthorization } from '../projects/project.authorization.js';
import { LayerRepository } from '../project-layers/layer.repository.js';
import { StructureRepository } from './structure.repository.js';
import type { structureInput } from './structure.schema.js';
export class StructureService {
  constructor(
    private db: Database,
    private repository: StructureRepository,
    private authorization: ProjectAuthorization,
  ) {}
  async get(id: string, userId: string) {
    await this.authorization.requireProjectAccess(id, userId);
    return this.repository.get(id);
  }
  set(id: string, userId: string, input: z.infer<typeof structureInput>) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(id, userId);
      const result = await new StructureRepository(tx).set(id, input.templateKey);
      if (input.layers) {
        const repo = new LayerRepository(tx);
        await repo.clear(id);
        for (const [sortOrder, layer] of [...input.layers]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .entries())
          await repo.add({ ...layer, projectId: id, sortOrder });
      }
      return result;
    });
  }
}
