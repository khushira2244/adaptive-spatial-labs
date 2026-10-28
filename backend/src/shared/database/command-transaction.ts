import { AsyncLocalStorage } from 'node:async_hooks';
import type { Database, Transaction } from './client.js';
import { AppError } from '../errors/app-error.js';
import {
  DomainEvents,
  domainEventSchema,
  type DomainEvent,
  type PostCommitFailure,
} from '../events/domain-events.js';

const ambient = new AsyncLocalStorage<{ active: boolean }>();
type Effect = { name: string; run: () => void | Promise<void> };
export type CommandTransaction = Readonly<{
  tx: Transaction;
  emit: (event: DomainEvent) => void;
  afterCommit: (name: string, work: Effect['run']) => void;
}>;
export type Committed<T> = Readonly<{
  result: T;
  postCommitFailures: readonly PostCommitFailure[];
}>;

/** Application boundary. Modules receive context.tx; never start their own command boundary. */
export class CommandTransactions {
  constructor(
    private readonly db: Database,
    private readonly events = new DomainEvents(),
  ) {}

  async run<T>(work: (context: CommandTransaction) => Promise<T>): Promise<Committed<T>> {
    if (ambient.getStore()?.active)
      throw new AppError(
        'NESTED_COMMAND_TRANSACTION',
        'Pass the existing transaction to participating modules.',
      );
    const state = { active: true };
    const effects: Effect[] = [];
    const failures: PostCommitFailure[] = [];
    let acceptingEffects = true;
    let result: T;
    try {
      result = await ambient.run(state, () =>
        this.db.transaction(async (tx) => {
          const assertOpen = () => {
            if (!acceptingEffects)
              throw new AppError('INVALID_LIFECYCLE', 'The command transaction is closed.');
          };
          const context: CommandTransaction = Object.freeze({
            tx,
            emit: (event: DomainEvent) => {
              assertOpen();
              const captured = domainEventSchema.parse(event);
              effects.push({
                name: captured.kind,
                run: async () => {
                  failures.push(...(await this.events.dispatch(captured)));
                },
              });
            },
            afterCommit: (name: string, run: Effect['run']) => {
              assertOpen();
              effects.push({ name, run });
            },
          });
          try {
            return await work(context);
          } finally {
            acceptingEffects = false;
          }
        }),
      );
    } finally {
      // Nested application commands remain forbidden until COMMIT/ROLLBACK has actually finished.
      state.active = false;
    }
    // Reached only once Drizzle has successfully committed (including commit-time constraints).
    for (const effect of effects) {
      try {
        await effect.run();
      } catch (error: unknown) {
        failures.push({ effect: effect.name, error });
      }
    }
    return { result, postCommitFailures: failures };
  }
}
