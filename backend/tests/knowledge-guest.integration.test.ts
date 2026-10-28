import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { fixture, type Fixture } from './fixture.js';
import { op } from './step2.fixture.js';
import { GuestAccess, guestAttribution } from '../src/shared/auth/guest-access.js';
import { PrincipalResolver } from '../src/shared/auth/principal-resolver.js';
import { scopedGuestAccess } from '../src/shared/database/foundation-schema.js';
import { authorRef, requirePrivateOwner } from '../src/modules/knowledge/knowledge.ownership.js';
import { privateAccess } from '../src/modules/knowledge/knowledge.access.js';
import { semanticScopeSchema } from '../src/modules/knowledge/knowledge.input.js';
describe('Knowledge guest attribution foundation, routes deliberately closed', () => {
  let f: Fixture;
  beforeAll(async () => {
    f = await fixture();
  });
  afterAll(async () => {
    await f?.close();
  });
  it('retains guest ActorRef through expiry/revocation without creating membership or User', async () => {
    const before = (
      await f.pool.query(
        'select (select count(*) from users) u,(select count(*) from organization_members) m,(select count(*) from project_editors) e',
      )
    ).rows[0];
    const scope = { kind: 'MEETING' as const, id: op() },
      access = new GuestAccess(f.db),
      issued = await access.provision(scope, new Date(Date.now() + 3600000));
    const resolver = new PrincipalResolver(f.db),
      principal = await resolver.guest(issued.token, scope);
    const attribution = authorRef({ userId: null, guestId: issued.access.id });
    expect(attribution).toEqual(principal.actor);
    expect(() =>
      requirePrivateOwner({ userId: null, guestId: issued.access.id }, principal.actor),
    ).not.toThrow();
    expect(() =>
      requirePrivateOwner(
        { userId: null, guestId: issued.access.id },
        { kind: 'SCOPED_GUEST', guestId: op() },
      ),
    ).toThrow();
    await expect(privateAccess(f.db, principal)).rejects.toMatchObject({
      code: 'DOMAIN_FORBIDDEN',
    });
    await f.db
      .update(scopedGuestAccess)
      .set({ expiresAt: new Date(Date.now() - 1) })
      .where(eq(scopedGuestAccess.id, issued.access.id));
    await expect(resolver.requireActive(principal, scope)).rejects.toMatchObject({
      code: 'DOMAIN_UNAUTHORIZED',
    });
    await access.revoke(issued.access.id);
    await expect(resolver.guest(issued.token, scope)).rejects.toMatchObject({
      code: 'DOMAIN_UNAUTHORIZED',
    });
    const [retained] = await f.db
      .select()
      .from(scopedGuestAccess)
      .where(eq(scopedGuestAccess.id, issued.access.id));
    expect(guestAttribution(retained!)).toEqual(attribution);
    const after = (
      await f.pool.query(
        'select (select count(*) from users) u,(select count(*) from organization_members) m,(select count(*) from project_editors) e',
      )
    ).rows[0];
    expect(after).toEqual(before);
    expect((await f.pool.query('select id from knowledge_items')).rowCount).toBe(0);
  });
  it('valid guest credential cannot enter registered content routes or invent parent domains', async () => {
    const scope = { kind: 'PRESENTATION' as const, id: op() },
      issued = await new GuestAccess(f.db).provision(scope, new Date(Date.now() + 3600000));
    for (const url of ['/api/v1/knowledge', '/api/v1/snapshots', '/api/v1/my-space']) {
      expect(
        (await f.app.inject({ url, headers: { authorization: 'Bearer ' + issued.token } }))
          .statusCode,
      ).toBe(401);
    }
    const result = await f.app.inject({
      method: 'POST',
      url: '/api/v1/knowledge',
      headers: { authorization: 'Bearer ' + issued.token },
      payload: { operationId: op(), category: 'NOTE', title: 'No scope', body: 'No route' },
    });
    expect(result.statusCode).toBe(401);
  });
  it.each(['handPath', 'rayPath', 'gazeHistory', 'hoverState', 'cameraPath', 'perFrameData'])(
    'semantic schema rejects transient %s',
    (field) => {
      expect(
        semanticScopeSchema.safeParse({
          format: 1,
          kind: 'WHOLE_ARCHITECTURE',
          architectureId: op(),
          architectureGraphRef: op(),
          architectureStamp: 0,
          [field]: [],
        }).success,
      ).toBe(false);
    },
  );
});
