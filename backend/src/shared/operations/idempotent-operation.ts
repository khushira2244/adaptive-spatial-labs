import type { Principal, InvitedScope } from '../auth/principal.js';
import { requirePrincipal, sameActor } from '../auth/principal.js';
import { PrincipalResolver } from '../auth/principal-resolver.js';
import { AppError } from '../errors/app-error.js';
import { CommandTransactions, type CommandTransaction } from '../database/command-transaction.js';
import {
  operationInputSchema,
  operationResultSchema,
  type OperationInput,
  type OperationResult,
} from './operation-input.js';
import { SemanticFingerprint } from './semantic-fingerprint.js';
import { OperationRepository } from './operation.repository.js';

export type OperationCommand = Readonly<{
  principal: Principal;
  operation: OperationInput;
  semanticRequest: unknown;
  invitedScope?: InvitedScope;
  // Mandatory, re-run for both new writes AND successful result replay.
  // Result-specific entitlement may be stricter than current parent access.
  authorize: (context: CommandTransaction, originalResult: OperationResult | null) => Promise<void>;
  execute: (context: CommandTransaction) => Promise<OperationResult>;
}>;

/** Application-only composition, not a route accepting a Principal from JSON. */
export class IdempotentOperations {
  constructor(
    private readonly transactions: CommandTransactions,
    private readonly fingerprints: SemanticFingerprint,
  ) {}
  async run(command: OperationCommand) {
    const principal = requirePrincipal(command.principal);
    const operation = operationInputSchema.parse(command.operation);
    const fingerprint = this.fingerprints.fingerprint(command.semanticRequest);
    return this.transactions.run(async (context) => {
      await new PrincipalResolver(context.tx).requireActive(principal, command.invitedScope);
      // Domain scope/result access precedes claim or disclosure; lifecycle/stale-write checks belong in execute.
      await command.authorize(context, null);
      const repository = new OperationRepository(context.tx);
      if (!(await repository.claim(operation, principal.actor, fingerprint))) {
        const existing = await repository.find(operation.id);
        if (!existing)
          throw new AppError('DOMAIN_CONFLICT', 'Operation is not available. Retry safely.');
        const actor = existing.userId
          ? { kind: 'USER' as const, userId: existing.userId }
          : { kind: 'SCOPED_GUEST' as const, guestId: existing.guestId! };
        if (!sameActor(principal.actor, actor))
          throw new AppError('DOMAIN_NOT_FOUND', 'Operation not found.');
        if (
          existing.commandKind !== operation.commandKind ||
          existing.scopeKind !== (operation.scope?.kind ?? null) ||
          existing.scopeId !== (operation.scope?.id ?? null) ||
          existing.requestFingerprint !== fingerprint
        )
          throw new AppError(
            'IDEMPOTENCY_MISMATCH',
            'This operation identity was used with different semantic input.',
          );
        if (existing.state !== 'COMPLETED' || !existing.result)
          throw new AppError('DOMAIN_CONFLICT', 'Operation is not complete.');
        const result = operationResultSchema.parse(existing.result);
        await command.authorize(context, result);
        await new PrincipalResolver(context.tx).requireActive(principal, command.invitedScope);
        return { result, replayed: true };
      }
      const result = operationResultSchema.parse(await command.execute(context));
      await new PrincipalResolver(context.tx).requireActive(principal, command.invitedScope);
      await repository.complete(operation.id, result);
      return { result, replayed: false };
    });
  }
}
