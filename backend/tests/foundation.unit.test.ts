import { describe, it, expect } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import { AppError, installErrorHandler } from '../src/shared/errors/app-error.js';
import { SemanticFingerprint } from '../src/shared/operations/semantic-fingerprint.js';
import {
  operationInputSchema,
  operationResultSchema,
} from '../src/shared/operations/operation-input.js';
import { advanceChangeStamp, requireChangeStamp } from '../src/shared/concurrency/change-stamp.js';
import { requirePrincipal, requireRegisteredPrincipal } from '../src/shared/auth/principal.js';
import {
  requireAllowed,
  requireLifecycle,
  requireScope,
  requireVisible,
} from '../src/shared/auth/authorization.js';

describe('Foundation pure primitives and error contract', () => {
  const fingerprints = new SemanticFingerprint(randomBytes(32));
  it('canonical semantic fingerprint is independent of object key order, including nested values', () => {
    expect(fingerprints.fingerprint({ b: [1, { y: true, x: null }], a: 'safe' })).toBe(
      fingerprints.fingerprint({ a: 'safe', b: [1, { x: null, y: true }] }),
    );
  });
  it('different types, values, array order and different private keys do not collide', () => {
    const values = ['1', 1, true, null, [1, 2], [2, 1]];
    expect(new Set(values.map((value) => fingerprints.fingerprint(value))).size).toBe(
      values.length,
    );
    expect(new SemanticFingerprint(randomBytes(32)).fingerprint('private')).not.toBe(
      fingerprints.fingerprint('private'),
    );
  });
  it('requires a strong stable fingerprint key', () => {
    expect(() => new SemanticFingerprint(Buffer.alloc(8))).toThrow();
  });
  it('rejects undefined, non-finite numbers, dates, sparse arrays and cyclic requests', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    for (const value of [undefined, { x: undefined }, Infinity, new Date(), new Array(2), cycle])
      expect(() => fingerprints.fingerprint(value)).toThrow();
  });
  it('rejects oversized semantic input and never includes its content in the error', () => {
    expect(() => fingerprints.fingerprint('PRIVATE'.repeat(50000))).toThrow(
      'Semantic request is too large.',
    );
  });
  it('accepts a matching stamp and advances exactly once', () => {
    expect(() => requireChangeStamp(4, 4)).not.toThrow();
    expect(advanceChangeStamp(4, 4)).toBe(5);
  });
  it('stale stamp is a typed conflict rather than a successful lost write', () => {
    try {
      advanceChangeStamp(5, 4);
      throw new Error('Expected conflict');
    } catch (error: unknown) {
      expect(error).toMatchObject({ code: 'STALE_CHANGE_STAMP' });
    }
  });
  it('rejects malformed or exhausted stamps', () => {
    expect(() => advanceChangeStamp(-1, -1)).toThrow();
    expect(() => advanceChangeStamp(1.5, 1.5)).toThrow();
    expect(() => advanceChangeStamp(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toThrow();
  });
  it('client-shaped principal with fake role/title is not server verified', () => {
    const forged = {
      actor: { kind: 'USER', userId: randomUUID() },
      role: 'OWNER',
      title: 'Architect',
    };
    expect(() => requirePrincipal(forged as never)).toThrow('Authentication required.');
    expect(() => requireRegisteredPrincipal(null)).toThrow();
  });
  it('authorization defaults deny and not-found helper does not disclose private existence', () => {
    expect(() => requireAllowed(false)).toThrow();
    expect(() => requireLifecycle(false)).toThrow();
    expect(() => requireScope({ kind: 'meeting', id: 'a' }, { kind: 'meeting', id: 'b' })).toThrow(
      'Resource not found.',
    );
    expect(() => requireVisible({ title: 'PRIVATE' }, false)).toThrow('Resource not found.');
    expect(() => requireVisible(null, true)).toThrow('Resource not found.');
    expect(requireVisible('safe', true)).toBe('safe');
  });
  it('external operation envelope rejects fake roles and extra request bodies', () => {
    expect(
      operationInputSchema.safeParse({
        id: randomUUID(),
        commandKind: 'test.create',
        role: 'OWNER',
      }).success,
    ).toBe(false);
    expect(
      operationInputSchema.safeParse({
        id: randomUUID(),
        commandKind: 'test.create',
        scope: { kind: 'project', id: 'bad' },
      }).success,
    ).toBe(false);
  });
  it('durable result accepts only a reference and safe bounded metadata, never private payload', () => {
    const result = {
      reference: { kind: 'project', id: randomUUID() },
      status: 'CREATED',
      changeStamp: 1,
    };
    expect(operationResultSchema.parse(result)).toEqual(result);
    expect(
      operationResultSchema.safeParse({ ...result, password: 'secret', body: 'PRIVATE' }).success,
    ).toBe(false);
    expect(
      operationResultSchema.safeParse({ ...result, status: 'private prose with spaces' }).success,
    ).toBe(false);
  });
  it('new typed errors follow existing Fastify error envelope and status conventions', async () => {
    const app = Fastify();
    installErrorHandler(app);
    const codes = [
      'DOMAIN_UNAUTHORIZED',
      'DOMAIN_FORBIDDEN',
      'DOMAIN_NOT_FOUND',
      'DOMAIN_CONFLICT',
      'STALE_CHANGE_STAMP',
      'INVALID_LIFECYCLE',
      'IDEMPOTENCY_MISMATCH',
    ] as const;
    for (const code of codes)
      app.get('/' + code, () => {
        throw new AppError(code, 'Safe failure.');
      });
    try {
      for (const [i, code] of codes.entries()) {
        const response = await app.inject('/' + code);
        expect(response.statusCode).toBe([401, 403, 404, 409, 409, 409, 409][i]);
        expect(response.json()).toEqual({
          error: { code, message: 'Safe failure.', details: null },
        });
      }
    } finally {
      await app.close();
    }
  });
});
