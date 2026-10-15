import type { Database } from '../../shared/database/client.js';
import type { StorageProvider } from '../../shared/storage/storage-provider.js';
import { AppError } from '../../shared/errors/app-error.js';
import { SourceRepository } from './source.repository.js';
export class UploadService {
  constructor(
    private db: Database,
    private repository: SourceRepository,
    private storage: StorageProvider,
    private maxBytes: number,
  ) {}
  async stage(userId: string, name: string, contentType: string, bytes: Buffer) {
    if (!bytes.length || bytes.length > this.maxBytes || name.length > 200)
      throw new AppError(
        'SOURCE_UPLOAD_FAILED',
        'File is empty, too large, or its name is too long.',
      );
    let key: string;
    try {
      key = await this.storage.put(bytes);
    } catch {
      throw new AppError('SOURCE_UPLOAD_FAILED', 'File could not be saved.');
    }
    try {
      const upload = await this.repository.stage({
        userId,
        name,
        contentType,
        byteSize: bytes.length,
        storageKey: key,
        expiresAt: new Date(Date.now() + 86400000),
      });
      return {
        id: upload.id,
        name: upload.name,
        contentType: upload.contentType,
        byteSize: upload.byteSize,
        expiresAt: upload.expiresAt.toISOString(),
      };
    } catch (e) {
      await this.storage.delete(key);
      throw e;
    }
  }
  async remove(id: string, userId: string) {
    const upload = await this.db.transaction(async (tx) => {
      const repo = new SourceRepository(tx);
      const record = await repo.staged(id);
      if (!record || record.userId !== userId)
        throw new AppError('SOURCE_NOT_FOUND', 'Upload not found.');
      await repo.consume(id);
      return record;
    });
    await this.storage.delete(upload.storageKey);
    return { removed: true };
  }
}
