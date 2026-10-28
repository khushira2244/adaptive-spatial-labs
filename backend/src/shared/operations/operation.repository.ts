import { eq } from 'drizzle-orm';
import type { Transaction } from '../database/client.js';
import { operationResults } from '../database/foundation-schema.js';
import type { ActorRef } from '../auth/principal.js';
import type { OperationInput, OperationResult } from './operation-input.js';

export class OperationRepository {
  constructor(private readonly tx: Transaction) {}
  async claim(input: OperationInput, actor: ActorRef, fingerprint: string): Promise<boolean> {
    // PostgreSQL uniqueness waits for a concurrent owner to commit/rollback.
    // RUNNING is never committed by the application: command + result share this transaction.
    const inserted = await this.tx
      .insert(operationResults)
      .values({
        id: input.id,
        userId: actor.kind === 'USER' ? actor.userId : null,
        guestId: actor.kind === 'SCOPED_GUEST' ? actor.guestId : null,
        commandKind: input.commandKind,
        scopeKind: input.scope?.kind ?? null,
        scopeId: input.scope?.id ?? null,
        requestFingerprint: fingerprint,
        state: 'RUNNING',
      })
      .onConflictDoNothing({ target: operationResults.id })
      .returning({ id: operationResults.id });
    return inserted.length === 1;
  }
  async find(id: string) {
    return (
      await this.tx.select().from(operationResults).where(eq(operationResults.id, id)).for('update')
    )[0];
  }
  async complete(id: string, result: OperationResult): Promise<void> {
    await this.tx
      .update(operationResults)
      .set({ state: 'COMPLETED', result, completedAt: new Date() })
      .where(eq(operationResults.id, id));
  }
}
