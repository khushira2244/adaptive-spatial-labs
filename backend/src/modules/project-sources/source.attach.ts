import type { z } from 'zod';
import type { Transaction } from '../../shared/database/client.js';
import { AppError } from '../../shared/errors/app-error.js';
import { SourceRepository } from './source.repository.js';
import type { sourceInput } from './source.schema.js';
// Shared by project creation and source addition; consumes staged metadata in the same transaction.
export async function attachSource(
  tx: Transaction,
  projectId: string,
  userId: string,
  input: z.infer<typeof sourceInput>,
) {
  const repository = new SourceRepository(tx);
  const upload = input.uploadId ? await repository.staged(input.uploadId) : undefined;
  if (input.uploadId && (!upload || upload.userId !== userId || upload.expiresAt <= new Date()))
    throw new AppError('SOURCE_NOT_FOUND', 'Upload not found or expired.');
  const source = await repository.add({
    projectId,
    addedByUserId: userId,
    sourceType: input.sourceType,
    name: input.name,
    status: upload ? 'UPLOADED' : 'PENDING',
    storageKey: upload?.storageKey ?? null,
    externalReference: input.externalReference,
    metadata: {
      contentType: upload?.contentType ?? null,
      byteSize: upload?.byteSize ?? null,
      note: input.note,
    },
  });
  if (upload) await repository.consume(upload.id);
  return source;
}
