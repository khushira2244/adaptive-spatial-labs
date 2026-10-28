import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { fixture, signup, type Fixture } from './fixture.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
import { organizations, refreshSessions } from '../src/shared/database/schema.js';
import { operationResults, scopedGuestAccess } from '../src/shared/database/foundation-schema.js';
import { CommandTransactions } from '../src/shared/database/command-transaction.js';
import {
  IdempotentOperations,
  type OperationCommand,
} from '../src/shared/operations/idempotent-operation.js';
import { SemanticFingerprint } from '../src/shared/operations/semantic-fingerprint.js';
import {
  operationInputSchema,
  operationResultSchema,
} from '../src/shared/operations/operation-input.js';
import {
  invitedScopeSchema,
  sameActor,
  verifiedPrincipal,
  type Principal,
} from '../src/shared/auth/principal.js';
import { PrincipalResolver } from '../src/shared/auth/principal-resolver.js';
import { GuestAccess } from '../src/shared/auth/guest-access.js';
import { requireScope } from '../src/shared/auth/authorization.js';

const lower = 'a0b1c2d3-1111-4111-8111-aabbccddeeff';
const upper = lower.toUpperCase();
const mixed = 'A0b1C2d3-1111-4111-8111-AaBbCcDdEeFf';
function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

describe('Step 1 audit fixes F01 / F02', () => {
  let f: Fixture;
  let user: Principal;
  const key = randomBytes(32);
  beforeAll(async () => {
    f = await fixture();
    user = await authenticatedPrincipal(f, await signup(f.app, 'audit-fixes-owner'));
  });
  afterAll(async () => {
    vi.useRealTimers();
    await f?.close();
  });
  const operations = () =>
    new IdempotentOperations(new CommandTransactions(f.db), new SemanticFingerprint(key));
  function command(principal = user): OperationCommand {
    return {
      principal,
      operation: { id: randomUUID(), commandKind: 'foundation.audit-fix' },
      semanticRequest: { chosen: 'same semantic action' },
      authorize: async () => undefined,
      execute: async ({ tx }) => {
        const id = randomUUID();
        await tx.insert(organizations).values({ id, name: 'One audit-fix business effect' });
        return { reference: { kind: 'organization', id }, status: 'CREATED' };
      },
    };
  }

  it('F01 canonicalizes accepted operation, result, invited scope and marked actor UUID boundaries', () => {
    const envelope = operationInputSchema.parse({
      id: upper,
      commandKind: 'foundation.scope',
      scope: { kind: 'meeting', id: mixed },
    });
    expect(envelope.id).toBe(lower);
    expect(envelope.scope?.id).toBe(lower);
    expect(
      operationResultSchema.parse({ reference: { kind: 'receipt', id: upper }, status: 'SAVED' })
        .reference.id,
    ).toBe(lower);
    expect(invitedScopeSchema.parse({ kind: 'MEETING', id: mixed }).id).toBe(lower);
    const principal = verifiedPrincipal(
      { kind: 'USER', userId: upper },
      { kind: 'USER_SESSION', sessionId: mixed, accessExpiresAt: Date.now() + 1000 },
    );
    expect(principal.actor).toEqual({ kind: 'USER', userId: lower });
    expect(principal.credential).toMatchObject({ sessionId: lower });
  });

  it('F01 compares same-kind ActorRef and scope UUIDs by identity, preserving genuine mismatch denial', () => {
    expect(sameActor({ kind: 'USER', userId: upper }, { kind: 'USER', userId: lower })).toBe(true);
    expect(
      sameActor({ kind: 'SCOPED_GUEST', guestId: mixed }, { kind: 'SCOPED_GUEST', guestId: lower }),
    ).toBe(true);
    expect(
      sameActor({ kind: 'USER', userId: lower }, { kind: 'SCOPED_GUEST', guestId: lower }),
    ).toBe(false);
    expect(sameActor({ kind: 'USER', userId: upper }, { kind: 'USER', userId: randomUUID() })).toBe(
      false,
    );
    expect(() =>
      requireScope({ kind: 'meeting', id: upper }, { kind: 'meeting', id: lower }),
    ).not.toThrow();
    expect(() =>
      requireScope({ kind: 'meeting', id: mixed }, { kind: 'presentation', id: lower }),
    ).toThrow();
    expect(() =>
      requireScope({ kind: 'meeting', id: mixed }, { kind: 'meeting', id: randomUUID() }),
    ).toThrow();
  });

  it('F01 commits uppercase operation scope and replays equivalent lower and uppercase scope unchanged', async () => {
    const base = command();
    const input = {
      ...base,
      operation: { ...base.operation, scope: { kind: 'meeting', id: upper } },
    };
    const first = await operations().run(input);
    expect(first.result.replayed).toBe(false);
    for (const id of [lower, upper, mixed]) {
      const replay = await operations().run({
        ...input,
        operation: { ...input.operation, scope: { kind: 'meeting', id } },
      });
      expect(replay.result.replayed).toBe(true);
      expect(replay.result.result).toEqual(first.result.result);
    }
    const [stored] = await f.db
      .select()
      .from(operationResults)
      .where(eq(operationResults.id, input.operation.id));
    expect(stored?.scopeId).toBe(lower);
    expect(
      await f.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, first.result.result.reference.id)),
    ).toHaveLength(1);
  });

  it('F01 genuinely different operation scope still conflicts', async () => {
    const base = command();
    const input = {
      ...base,
      operation: { ...base.operation, scope: { kind: 'meeting', id: lower } },
    };
    await operations().run(input);
    await expect(
      operations().run({
        ...input,
        operation: { ...input.operation, scope: { kind: 'meeting', id: randomUUID() } },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_MISMATCH' });
  });

  it('F01 guest provision, resolve and requireActive accept equivalent mixed-case scopes', async () => {
    const issued = await new GuestAccess(f.db).provision(
      { kind: 'MEETING', id: upper },
      new Date(Date.now() + 3600000),
    );
    expect(issued.access.scopeId).toBe(lower);
    const resolver = new PrincipalResolver(f.db);
    for (const id of [mixed, lower, upper]) {
      const principal = await resolver.guest(issued.token, { kind: 'MEETING', id });
      expect(principal.actor).toEqual(issued.actor);
      await expect(
        resolver.requireActive(principal, { kind: 'MEETING', id }),
      ).resolves.toBeUndefined();
    }
  });

  it('F01 genuinely different guest scope or kind still rejects', async () => {
    const issued = await new GuestAccess(f.db).provision(
      { kind: 'MEETING', id: lower },
      new Date(Date.now() + 3600000),
    );
    const resolver = new PrincipalResolver(f.db);
    await expect(
      resolver.guest(issued.token, { kind: 'MEETING', id: randomUUID() }),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
    await expect(
      resolver.guest(issued.token, { kind: 'PRESENTATION', id: lower }),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
  });

  async function replayExpiry(
    principal: Principal,
    expiresAt: number,
    invitedScope?: { kind: 'MEETING'; id: string },
  ) {
    const base = command(principal);
    const input: OperationCommand = invitedScope ? { ...base, invitedScope } : base;
    const original = await operations().run(input);
    const reached = barrier();
    const resume = barrier();
    let executed = 0;
    const pending = operations().run({
      ...input,
      authorize: async (_context, result) => {
        if (result) {
          reached.release();
          await resume.promise;
        }
      },
      execute: async () => {
        executed++;
        throw new Error('Replay must never execute');
      },
    });
    // Attach rejection observer before releasing so no rejection can be lost/unhandled.
    const settled = pending.then(
      (value) => ({ kind: 'allowed' as const, value }),
      (error: unknown) => ({ kind: 'denied' as const, error }),
    );
    try {
      await reached.promise; // Existing receipt has been read/locked; initial credential check passed.
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(expiresAt + 1);
      resume.release();
      const outcome = await settled;
      expect(outcome).toMatchObject({ kind: 'denied', error: { code: 'DOMAIN_UNAUTHORIZED' } });
      expect(executed).toBe(0);
    } finally {
      resume.release();
      await settled;
      vi.useRealTimers();
    }
    const rows = await f.db
      .select()
      .from(operationResults)
      .where(eq(operationResults.id, input.operation.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.state).toBe('COMPLETED');
    expect(rows[0]?.result).toEqual(original.result.result);
    expect(
      await f.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, original.result.result.reference.id)),
    ).toHaveLength(1);
  }

  it('F02 denies User replay if token expires while result authorization is blocked', async () => {
    if (user.credential.kind !== 'USER_SESSION') throw new Error('Expected User');
    await replayExpiry(user, user.credential.accessExpiresAt);
  });

  it('F02 denies guest replay if access expires while result authorization is blocked', async () => {
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const expiresAt = new Date(Date.now() + 3600000);
    const issued = await new GuestAccess(f.db).provision(scope, expiresAt);
    await replayExpiry(
      await new PrincipalResolver(f.db).guest(issued.token, scope),
      expiresAt.getTime(),
      scope,
    );
  });

  // Observe a real row-lock wait, not a sleep or a guess about the scheduled query.
  async function expireAcrossRead(
    table: 'refresh_sessions' | 'scoped_guest_access',
    id: string,
    expiresAt: number,
    read: () => Promise<unknown>,
  ) {
    const locker = await f.pool.connect();
    let settled: Promise<{ kind: string; error?: unknown }> | undefined;
    try {
      await locker.query('BEGIN');
      // table is restricted by the literal union above, never external input.
      await locker.query('SELECT id FROM ' + table + ' WHERE id = $1 FOR UPDATE', [id]);
      const pid = (await locker.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!
        .pid;
      settled = read().then(
        () => ({ kind: 'allowed' }),
        (error: unknown) => ({ kind: 'denied', error }),
      );
      let blocked = false;
      for (let probe = 0; probe < 200 && !blocked; probe++) {
        const result = await f.pool.query<{ blocked: boolean }>(
          'SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1::int = ANY(pg_blocking_pids(pid))) AS blocked',
          [pid],
        );
        blocked = result.rows[0]!.blocked;
      }
      expect(blocked, 'Reader must actually be waiting on our PostgreSQL row lock').toBe(true);
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(expiresAt + 1);
      await locker.query('COMMIT');
      expect(await settled).toMatchObject({
        kind: 'denied',
        error: { code: 'DOMAIN_UNAUTHORIZED' },
      });
    } finally {
      await locker.query('ROLLBACK');
      if (settled) await settled;
      locker.release();
      vi.useRealTimers();
    }
  }

  it('F02 User requireActive checks current time AFTER blocked session lookup', async () => {
    if (user.credential.kind !== 'USER_SESSION') throw new Error('Expected User');
    await expireAcrossRead(
      'refresh_sessions',
      user.credential.sessionId,
      user.credential.accessExpiresAt,
      () => new PrincipalResolver(f.db).requireActive(user),
    );
  });

  it('F02 guest requireActive checks current time AFTER blocked access lookup', async () => {
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    const principal = await new PrincipalResolver(f.db).guest(issued.token, scope);
    await expireAcrossRead(
      'scoped_guest_access',
      issued.access.id,
      issued.access.expiresAt.getTime(),
      () => new PrincipalResolver(f.db).requireActive(principal, scope),
    );
  });

  it('F02 guest resolver checks current time AFTER blocked credential lookup', async () => {
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    await expireAcrossRead(
      'scoped_guest_access',
      issued.access.id,
      issued.access.expiresAt.getTime(),
      () => new PrincipalResolver(f.db).guest(issued.token, scope),
    );
  });
});
