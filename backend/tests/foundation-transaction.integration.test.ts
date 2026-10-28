import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { fixture, type Fixture } from './fixture.js';
import { organizations } from '../src/shared/database/schema.js';
import {
  CommandTransactions,
  type CommandTransaction,
} from '../src/shared/database/command-transaction.js';
import { DomainEvents } from '../src/shared/events/domain-events.js';
import { advanceChangeStamp, requireChangedRow } from '../src/shared/concurrency/change-stamp.js';

describe('PostgreSQL command transaction / post-commit boundary', () => {
  let f: Fixture;
  beforeAll(async () => {
    f = await fixture();
  });
  afterAll(async () => {
    await f?.close();
  });

  it('commits module writes and executes effects only after a separate connection sees commit', async () => {
    const events = new DomainEvents();
    const runner = new CommandTransactions(f.db, events);
    const id = randomUUID();
    let delivered = 0;
    events.subscribe('foundation.created', 'read-after-commit', async () => {
      const read = await f.pool.query('select id from organizations where id = $1', [id]);
      expect(read.rowCount).toBe(1);
      delivered++;
    });
    const result = await runner.run(async (context) => {
      await context.tx.insert(organizations).values({ id, name: 'Foundation committed' });
      context.emit({
        id: randomUUID(),
        kind: 'foundation.created',
        aggregate: { kind: 'organization', id },
      });
      expect(delivered).toBe(0);
      const before = await f.pool.query('select id from organizations where id = $1', [id]);
      expect(before.rowCount).toBe(0);
      return id;
    });
    expect(result.result).toBe(id);
    expect(result.postCommitFailures).toEqual([]);
    expect(delivered).toBe(1);
  });

  it('failure rolls back all writes and discards event and afterCommit work', async () => {
    const runner = new CommandTransactions(f.db);
    const id = randomUUID();
    let called = false;
    await expect(
      runner.run(async (context) => {
        await context.tx.insert(organizations).values({ id, name: 'Rollback' });
        context.afterCommit('should-not-run', () => {
          called = true;
        });
        throw new Error('Domain validation failed');
      }),
    ).rejects.toThrow('Domain validation failed');
    expect(await f.db.select().from(organizations).where(eq(organizations.id, id))).toEqual([]);
    expect(called).toBe(false);
  });

  it('commit-time database failure also suppresses effects', async () => {
    const runner = new CommandTransactions(f.db);
    let called = false;
    await expect(
      runner.run(async (context) => {
        // Temporary, test-only deferred constraint proves effects do not run at callback completion.
        await context.tx.execute(
          sql`CREATE TEMP TABLE foundation_deferred_probe (id integer UNIQUE DEFERRABLE INITIALLY DEFERRED) ON COMMIT DROP`,
        );
        await context.tx.execute(sql`INSERT INTO foundation_deferred_probe VALUES (1), (1)`);
        context.afterCommit('deferred-failure', () => {
          called = true;
        });
      }),
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  it('one failing listener cannot roll back commit or prevent other listeners', async () => {
    const bus = new DomainEvents();
    const runner = new CommandTransactions(f.db, bus);
    const id = randomUUID();
    let delivered = 0;
    bus.subscribe('foundation.created', 'failing-listener', () => {
      throw new Error('Listener down');
    });
    bus.subscribe('foundation.created', 'healthy-listener', () => {
      delivered++;
    });
    const result = await runner.run(async (context) => {
      await context.tx.insert(organizations).values({ id, name: 'Survives listener' });
      context.emit({
        id: randomUUID(),
        kind: 'foundation.created',
        aggregate: { kind: 'organization', id },
      });
      context.afterCommit('another-failure', () => {
        throw new Error('Effect down');
      });
    });
    expect(delivered).toBe(1);
    expect(result.postCommitFailures.map((x) => x.effect)).toEqual([
      'failing-listener',
      'another-failure',
    ]);
    expect(await f.db.select().from(organizations).where(eq(organizations.id, id))).toHaveLength(1);
  });

  it('rejects nested application command boundary even from another runner', async () => {
    const id = randomUUID();
    const runner = new CommandTransactions(f.db);
    await expect(
      runner.run(async (context) => {
        await context.tx.insert(organizations).values({ id, name: 'No independent inner commit' });
        await new CommandTransactions(f.db).run(async () => 'nested');
      }),
    ).rejects.toMatchObject({ code: 'NESTED_COMMAND_TRANSACTION' });
    expect(await f.db.select().from(organizations).where(eq(organizations.id, id))).toHaveLength(0);
  });

  it('allows new independent command after commit and rejects registering effects on a closed context', async () => {
    const runner = new CommandTransactions(f.db);
    let saved: CommandTransaction | undefined;
    let nextRan = false;
    await runner.run(async (context) => {
      saved = context;
      context.afterCommit('new-command', async () => {
        await runner.run(async () => {
          nextRan = true;
        });
      });
    });
    expect(nextRan).toBe(true);
    expect(() => saved!.afterCommit('late', () => undefined)).toThrow(
      'The command transaction is closed.',
    );
  });

  it('matching semantic write advances a persisted stamp and stale update cannot overwrite it', async () => {
    await new CommandTransactions(f.db).run(async ({ tx }) => {
      await tx.execute(
        sql`CREATE TEMP TABLE foundation_stamp_probe (stamp integer NOT NULL) ON COMMIT DROP`,
      );
      await tx.execute(sql`INSERT INTO foundation_stamp_probe VALUES (3)`);
      const next = advanceChangeStamp(3, 3);
      const updated = await tx.execute(
        sql`UPDATE foundation_stamp_probe SET stamp = ${next} WHERE stamp = 3 RETURNING stamp`,
      );
      expect(updated.rows).toEqual([{ stamp: 4 }]);
      const stale = await tx.execute(
        sql`UPDATE foundation_stamp_probe SET stamp = 5 WHERE stamp = 3 RETURNING stamp`,
      );
      expect(stale.rows).toEqual([]);
      expect(() => requireChangedRow(stale.rows[0])).toThrow('The item changed.');
      expect(requireChangedRow(updated.rows[0])).toEqual({ stamp: 4 });
      expect(() => advanceChangeStamp(4, 3)).toThrow();
    });
  });
});
