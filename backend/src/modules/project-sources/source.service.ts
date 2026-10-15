import type { z } from 'zod';
import type { Database } from '../../shared/database/client.js';
import type { StorageProvider } from '../../shared/storage/storage-provider.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ProjectAuthorization } from '../projects/project.authorization.js';
import { SourceRepository } from './source.repository.js';
import { attachSource } from './source.attach.js';
import { sourceDto } from './source.types.js';
import type { sourceInput } from './source.schema.js';
export class SourceService {
  constructor(
    private db: Database,
    private repository: SourceRepository,
    private authorization: ProjectAuthorization,
    private storage: StorageProvider,
  ) {}
  async list(id: string, userId: string) {
    await this.authorization.requireProjectAccess(id, userId);
    return (await this.repository.list(id)).map(sourceDto);
  }
  add(id: string, userId: string, input: z.infer<typeof sourceInput>) {
    return this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(id, userId);
      return sourceDto(await attachSource(tx, id, userId, input));
    });
  }
  async remove(id: string, sourceId: string, userId: string) {
    const removed = await this.db.transaction(async (tx) => {
      await new ProjectAuthorization(tx, true).requireProjectEditorOrOwner(id, userId);
      const source = await new SourceRepository(tx).remove(id, sourceId);
      if (!source) throw new AppError('SOURCE_NOT_FOUND', 'Source not found.');
      return source;
    });
    // File failures leave inaccessible orphan bytes, never resurrect deleted metadata.
    if (removed.storageKey) await this.storage.delete(removed.storageKey);
    return { removed: true };
  }
  async download(id: string, sourceId: string, userId: string) {
    await this.authorization.requireProjectAccess(id, userId);
    const source = await this.repository.get(id, sourceId);
    if (!source?.storageKey) throw new AppError('SOURCE_NOT_FOUND', 'Source file not found.');
    return this.storage.get(source.storageKey);
  }
}
