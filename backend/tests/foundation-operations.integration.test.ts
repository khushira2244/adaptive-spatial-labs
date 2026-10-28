import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { organizations, refreshSessions } from '../src/shared/database/schema.js';
import { operationResults } from '../src/shared/database/foundation-schema.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
import type { Principal } from '../src/shared/auth/principal.js';
import {
  CommandTransactions,
  type CommandTransaction,
} from '../src/shared/database/command-transaction.js';
import {
  IdempotentOperations,
  type OperationCommand,
} from '../src/shared/operations/idempotent-operation.js';
import { SemanticFingerprint } from '../src/shared/operations/semantic-fingerprint.js';
import { DomainEvents } from '../src/shared/events/domain-events.js';
import { requireAllowed } from '../src/shared/auth/authorization.js';

describe('Durable PostgreSQL operation/result foundation', () => {
  let f: Fixture;
  let owner: Actor;
  let outsider: Actor;
  let principal: Principal;
  let other: Principal;
  const key = randomBytes(32);
  beforeAll(async () => {
    f = await fixture();
    ({ owner, outsider } = await actors(f));
    principal = await authenticatedPrincipal(f, owner);
    other = await authenticatedPrincipal(f, outsider);
  });
  afterAll(async () => {
    await f?.close();
  });
  const service = () =>
    new IdempotentOperations(new CommandTransactions(f.db), new SemanticFingerprint(key));
  function command(overrides: Partial<OperationCommand> = {}): OperationCommand {
    return {
      principal,
      operation: { id: randomUUID(), commandKind: 'foundation.create' },
      semanticRequest: { value: 'chosen semantic input' },
      authorize: async () => undefined,
      execute: async ({ tx }) => {
        const id = randomUUID();
        await tx.insert(organizations).values({ id, name: 'Idempotent test side effect' });
        return { reference: { kind: 'organization', id }, status: 'CREATED' };
      },
      ...overrides,
    };
  }

  it('same intention returns original durable result even after service reconstruction', async () => {
    let mutations = 0;
    const input = command();
    const originalExecute = input.execute;
    const run = {
      ...input,
      execute: async (context: CommandTransaction) => {
        mutations++;
        return originalExecute(context);
      },
    };
    const first = await service().run(run);
    const second = await service().run(run);
    expect(first.result.replayed).toBe(false);
    expect(second.result.replayed).toBe(true);
    expect(second.result.result).toEqual(first.result.result);
    expect(mutations).toBe(1);
    const [receipt] = await f.db
      .select()
      .from(operationResults)
      .where(eq(operationResults.id, run.operation.id));
    expect(receipt?.state).toBe('COMPLETED');
    expect(receipt?.completedAt).toBeInstanceOf(Date);
    expect(JSON.stringify(receipt)).not.toContain('chosen semantic input');
    expect(receipt?.requestFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changed semantic input, command kind or scope under same operation identity conflicts', async () => {
    const input = command();
    await service().run(input);
    await expect(
      service().run({ ...input, semanticRequest: { value: 'different' } }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH' });
    await expect(
      service().run({
        ...input,
        operation: { ...input.operation, commandKind: 'foundation.other' },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH' });
    await expect(
      service().run({
        ...input,
        operation: { ...input.operation, scope: { kind: 'project', id: randomUUID() } },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH' });
  });

  it('intentional repeated command with new operation identity executes independently', async () => {
    const input = command();
    const first = await service().run(input);
    const second = await service().run({
      ...input,
      operation: { ...input.operation, id: randomUUID() },
    });
    expect(second.result.replayed).toBe(false);
    expect(second.result.result.reference.id).not.toBe(first.result.result.reference.id);
  });

  it('concurrent duplicate attempts commit one effect and one durable result', async () => {
    let mutations = 0;
    const input = command();
    const originalExecute = input.execute;
    const execute = async (context: CommandTransaction) => {
      mutations++;
      return originalExecute(context);
    };
    const results = await Promise.all(
      Array.from({ length: 8 }, () => service().run({ ...input, execute })),
    );
    expect(mutations).toBe(1);
    expect(results.filter((x) => !x.result.replayed)).toHaveLength(1);
    expect(new Set(results.map((x) => x.result.result.reference.id)).size).toBe(1);
    expect(
      await f.db.select().from(operationResults).where(eq(operationResults.id, input.operation.id)),
    ).toHaveLength(1);
  });

  it('concurrent conflicting semantic attempts cannot commit two different successes', async () => {
    const input = command();
    const outcomes = await Promise.allSettled([
      service().run(input),
      service().run({ ...input, semanticRequest: { value: 'racing different request' } }),
    ]);
    expect(outcomes.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    const failure = outcomes.find((x) => x.status === 'rejected');
    expect(failure?.status === 'rejected' && failure.reason).toMatchObject({
      code: 'IDEMPOTENCY_MISMATCH',
    });
  });

  it('failed attempt rolls back command, claim and event; same intention can then succeed', async () => {
    const id = randomUUID();
    let notified = 0;
    const bus = new DomainEvents();
    bus.subscribe('foundation.created', 'count', () => {
      notified++;
    });
    const runner = new IdempotentOperations(
      new CommandTransactions(f.db, bus),
      new SemanticFingerprint(key),
    );
    const input = command({
      execute: async (context) => {
        await context.tx.insert(organizations).values({ id, name: 'Rolled back' });
        context.emit({
          id: randomUUID(),
          kind: 'foundation.created',
          aggregate: { kind: 'organization', id },
        });
        throw new Error('Business failed');
      },
    });
    await expect(runner.run(input)).rejects.toThrow('Business failed');
    expect(await f.db.select().from(organizations).where(eq(organizations.id, id))).toHaveLength(0);
    expect(
      await f.db.select().from(operationResults).where(eq(operationResults.id, input.operation.id)),
    ).toHaveLength(0);
    expect(notified).toBe(0);
    const retried = await runner.run({ ...input, execute: command().execute });
    expect(retried.result.replayed).toBe(false);
  });

  it('unsafe result metadata rolls back domain writes instead of persisting a private response', async () => {
    const id = randomUUID();
    const input = command({
      execute: async ({ tx }) => {
        await tx.insert(organizations).values({ id, name: 'Unsafe receipt rejected' });
        return { reference: { kind: 'organization', id }, status: 'CREATED', password: 'secret' };
      },
    });
    await expect(service().run(input)).rejects.toThrow();
    expect(await f.db.select().from(organizations).where(eq(organizations.id, id))).toHaveLength(0);
    expect(
      await f.db.select().from(operationResults).where(eq(operationResults.id, input.operation.id)),
    ).toHaveLength(0);
  });

  it('another authenticated actor cannot read another actor operation result', async () => {
    const input = command();
    await service().run(input);
    await expect(service().run({ ...input, principal: other })).rejects.toMatchObject({
      code: 'DOMAIN_NOT_FOUND',
      message: 'Operation not found.',
    });
  });

  it('rechecks result-specific access before replay and does not rerun stale mutation checks', async () => {
    let permitted = true;
    let authorizedReplay = 0;
    const input = command({
      authorize: async (_context, result) => {
        requireAllowed(permitted);
        if (result) authorizedReplay++;
      },
    });
    await service().run(input);
    const replay = await service().run({
      ...input,
      execute: async () => {
        throw new Error('Old stamp must not re-execute');
      },
    });
    expect(replay.result.replayed).toBe(true);
    expect(authorizedReplay).toBe(1);
    permitted = false;
    await expect(service().run(input)).rejects.toMatchObject({ code: 'DOMAIN_FORBIDDEN' });
  });

  it('database constraint rejects a receipt with no actor', async () => {
    await expect(
      f.db.insert(operationResults).values({
        id: randomUUID(),
        commandKind: 'foundation.bad',
        state: 'RUNNING',
        requestFingerprint: '0'.repeat(64),
      }),
    ).rejects.toThrow();
  });

  it('new command cannot use a logged-out registered credential despite old Principal object', async () => {
    const input = command({ principal: other });
    await f.db
      .update(refreshSessions)
      .set({ revokedAt: new Date() })
      .where(eq(refreshSessions.userId, outsider.id));
    await expect(service().run(input)).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
  });

  it('receipt replay never emits a second post-commit domain event', async () => {
    let delivered = 0;
    const bus = new DomainEvents();
    bus.subscribe('foundation.created', 'once-per-commit', () => {
      delivered++;
    });
    const run = new IdempotentOperations(
      new CommandTransactions(f.db, bus),
      new SemanticFingerprint(key),
    );
    const input = command({
      execute: async (context) => {
        const id = randomUUID();
        await context.tx
          .insert(organizations)
          .values({ id, name: 'Event exactly per command commit' });
        context.emit({
          id: randomUUID(),
          kind: 'foundation.created',
          aggregate: { kind: 'organization', id },
        });
        return { reference: { kind: 'organization', id }, status: 'CREATED' };
      },
    });
    await run.run(input);
    await run.run(input);
    expect(delivered).toBe(1);
  });

  it('a concurrent retry can complete after the first claimant rolls back', async () => {
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const input = command();
    const failing = service()
      .run({
        ...input,
        execute: async () => {
          entered();
          await released;
          throw new Error('First claimant failed');
        },
      })
      .then(
        () => false,
        () => true,
      );
    await started;
    const retry = service().run(input);
    release();
    expect(await failing).toBe(true);
    expect((await retry).result.replayed).toBe(false);
    expect((await service().run(input)).result.replayed).toBe(true);
  });
});
