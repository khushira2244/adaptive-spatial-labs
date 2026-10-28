import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { fixture, actors, createProject, type Fixture, type Actor } from './fixture.js';
import {
  refreshSessions,
  users,
  organizationMembers,
  projectEditors,
} from '../src/shared/database/schema.js';
import { scopedGuestAccess } from '../src/shared/database/foundation-schema.js';
import {
  GuestAccess,
  guestAccessState,
  guestAttribution,
} from '../src/shared/auth/guest-access.js';
import { PrincipalResolver } from '../src/shared/auth/principal-resolver.js';
import { authenticatedPrincipal, authService } from './foundation.fixture.js';
import { requireRegisteredPrincipal, type Principal } from '../src/shared/auth/principal.js';
import { ProjectAccess } from '../src/shared/auth/authorization.js';
import { CommandTransactions } from '../src/shared/database/command-transaction.js';
import { IdempotentOperations } from '../src/shared/operations/idempotent-operation.js';
import { SemanticFingerprint } from '../src/shared/operations/semantic-fingerprint.js';

describe('Principal / scoped guest / reused Group 1 authorization', () => {
  let f: Fixture;
  let owner: Actor;
  let editor: Actor;
  let outsider: Actor;
  let projectId: string;
  let registered: Principal;
  let editing: Principal;
  let outside: Principal;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    projectId = (await createProject(f, owner, { editorUserIds: [editor.id] })).id;
    registered = await authenticatedPrincipal(f, owner);
    editing = await authenticatedPrincipal(f, editor);
    outside = await authenticatedPrincipal(f, outsider);
  });
  afterAll(async () => {
    await f?.close();
  });

  it('registered authenticated identity resolves stable User actor distinct from credential/session', () => {
    expect(registered.actor).toEqual({ kind: 'USER', userId: owner.id });
    expect(registered.credential.kind).toBe('USER_SESSION');
    expect(requireRegisteredPrincipal(registered).userId).toBe(owner.id);
  });
  it('registered session cannot be rebound to another user or client role', async () => {
    const [session] = await f.db
      .select()
      .from(refreshSessions)
      .where(eq(refreshSessions.userId, owner.id));
    await expect(
      new PrincipalResolver(f.db).registered(authService(f), 'not-a-signed-token'),
    ).rejects.toThrow();
    await expect(
      new PrincipalResolver(f.db).registered(authService(f), {
        userId: owner.id,
        sessionId: session!.id,
        role: 'OWNER',
      } as never),
    ).rejects.toThrow();
  });
  it('owner accepted and editor retains read/structure-authoring but no owner privilege', async () => {
    await new CommandTransactions(f.db).run(async ({ tx }) => {
      const policy = new ProjectAccess(tx);
      expect((await policy.owner(registered, projectId)).role).toBe('OWNER');
      expect((await policy.read(editing, projectId)).role).toBe('EDITOR');
      expect((await policy.editorOrOwner(editing, projectId)).role).toBe('EDITOR');
      await expect(policy.owner(editing, projectId)).rejects.toMatchObject({
        code: 'DOMAIN_NOT_FOUND',
      });
    });
  });
  it('unrelated user and unknown project produce same safe not-found result', async () => {
    const policy = new ProjectAccess(f.db);
    for (const id of [projectId, randomUUID()])
      await expect(policy.read(outside, id)).rejects.toMatchObject({
        code: 'DOMAIN_NOT_FOUND',
        message: 'Resource not found.',
      });
  });
  it('guest credential resolves scoped actor and creates no User, organization member or project editor', async () => {
    const before = {
      users: (await f.db.select().from(users)).length,
      members: (await f.db.select().from(organizationMembers)).length,
      editors: (await f.db.select().from(projectEditors)).length,
    };
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    const principal = await new PrincipalResolver(f.db).guest(issued.token, scope);
    expect(principal.actor).toEqual(issued.actor);
    expect(principal.actor.kind).toBe('SCOPED_GUEST');
    expect(issued.access.tokenDigest).not.toBe(issued.token);
    expect(() => requireRegisteredPrincipal(principal)).toThrow('A registered user is required.');
    await expect(new ProjectAccess(f.db).read(principal, projectId)).rejects.toMatchObject({
      code: 'DOMAIN_FORBIDDEN',
    });
    expect((await f.db.select().from(users)).length).toBe(before.users);
    expect((await f.db.select().from(organizationMembers)).length).toBe(before.members);
    expect((await f.db.select().from(projectEditors)).length).toBe(before.editors);
  });
  it('guest wrong scope, expired scope and revoked access deny credentials while attribution remains', async () => {
    const scope = { kind: 'PRESENTATION' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    const resolver = new PrincipalResolver(f.db);
    const principal = await resolver.guest(issued.token, scope);
    await expect(
      resolver.guest(issued.token, { ...scope, id: randomUUID() }),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
    await expect(
      resolver.guest(issued.token, scope, new Date(Date.now() + 7200000)),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
    expect(guestAccessState(issued.access, new Date(Date.now() + 7200000))).toBe('EXPIRED');
    await new GuestAccess(f.db).revoke(issued.access.id);
    await expect(resolver.guest(issued.token, scope)).rejects.toMatchObject({
      code: 'DOMAIN_UNAUTHORIZED',
    });
    await expect(resolver.requireActive(principal, scope)).rejects.toMatchObject({
      code: 'DOMAIN_UNAUTHORIZED',
    });
    const [retained] = await f.db
      .select()
      .from(scopedGuestAccess)
      .where(eq(scopedGuestAccess.id, issued.access.id));
    expect(guestAccessState(retained!)).toBe('REVOKED');
    expect(guestAttribution(retained!)).toEqual(issued.actor);
  });
  it('guest operations require matching invited scope and preserve original durable result on valid replay', async () => {
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    const principal = await new PrincipalResolver(f.db).guest(issued.token, scope);
    const operations = new IdempotentOperations(
      new CommandTransactions(f.db),
      new SemanticFingerprint(randomBytes(32)),
    );
    const input = {
      principal,
      invitedScope: scope,
      operation: {
        id: randomUUID(),
        commandKind: 'foundation.guest',
        scope: { kind: 'meeting', id: scope.id },
      },
      semanticRequest: { test: true },
      authorize: async () => undefined,
      execute: async () => ({
        reference: { kind: 'guest_receipt', id: randomUUID() },
        status: 'SAVED',
      }),
    };
    const first = await operations.run(input);
    expect((await operations.run(input)).result.result).toEqual(first.result.result);
    await expect(
      operations.run({ ...input, invitedScope: { ...scope, id: randomUUID() } }),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
    await new GuestAccess(f.db).revoke(issued.access.id);
    await expect(operations.run(input)).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
  });
  it('archived project semantics are inherited from Group 1 rather than a second permission policy', async () => {
    await f.app.inject({
      method: 'PATCH',
      url: '/api/v1/projects/' + projectId,
      headers: owner.headers,
      payload: { status: 'ARCHIVED' },
    });
    const policy = new ProjectAccess(f.db);
    expect((await policy.read(editing, projectId)).role).toBe('EDITOR');
    await expect(policy.editorOrOwner(editing, projectId)).rejects.toMatchObject({
      code: 'PROJECT_INVALID_STATE',
    });
    await expect(policy.owner(registered, projectId)).rejects.toMatchObject({
      code: 'PROJECT_INVALID_STATE',
    });
    expect((await policy.owner(registered, projectId, true)).role).toBe('OWNER');
  });

  it('a previously resolved guest cannot write after persisted expiry; attribution remains', async () => {
    const scope = { kind: 'MEETING' as const, id: randomUUID() };
    const issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    const resolver = new PrincipalResolver(f.db);
    const principal = await resolver.guest(issued.token, scope);
    await f.db
      .update(scopedGuestAccess)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(scopedGuestAccess.id, issued.access.id));
    await expect(resolver.requireActive(principal, scope)).rejects.toMatchObject({
      code: 'DOMAIN_UNAUTHORIZED',
    });
    const [stored] = await f.db
      .select()
      .from(scopedGuestAccess)
      .where(eq(scopedGuestAccess.id, issued.access.id));
    expect(guestAccessState(stored!)).toBe('EXPIRED');
    expect(guestAttribution(stored!)).toEqual(issued.actor);
    // Opaque guest credential is not accepted by existing Group 1 registered-user routes.
    const response = await f.app.inject({
      url: '/api/v1/projects',
      headers: { authorization: 'Bearer ' + issued.token },
    });
    expect(response.statusCode).toBe(401);
  });

  it('cached User principal loses access at access-token expiry, before refresh-session expiry', async () => {
    if (registered.credential.kind !== 'USER_SESSION')
      throw new Error('Expected registered principal');
    const afterTokenExpiry = new Date(registered.credential.accessExpiresAt + 1);
    await expect(
      new PrincipalResolver(f.db).requireActive(registered, undefined, afterTokenExpiry),
    ).rejects.toMatchObject({ code: 'DOMAIN_UNAUTHORIZED' });
    expect(registered.actor).toEqual({ kind: 'USER', userId: owner.id });
  });
});
