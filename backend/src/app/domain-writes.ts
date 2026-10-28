import { createHmac } from 'node:crypto';
import type { Database } from '../shared/database/client.js';
import type { Config } from '../shared/config/config.js';
import { CommandTransactions } from '../shared/database/command-transaction.js';
import { IdempotentOperations } from '../shared/operations/idempotent-operation.js';
import { SemanticFingerprint } from '../shared/operations/semantic-fingerprint.js';
export function domainWrites(db: Database, config: Config) {
  const key = createHmac('sha256', config.REFRESH_TOKEN_SECRET)
    .update('asl.operation-fingerprints.v1')
    .digest();
  return new IdempotentOperations(new CommandTransactions(db), new SemanticFingerprint(key));
}
