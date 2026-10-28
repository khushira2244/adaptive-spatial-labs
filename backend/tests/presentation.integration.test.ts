import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { architectureContext, op } from './step2.fixture.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
import { PresentationService } from '../src/modules/presentations/presentation.service.js';
import { domainWrites } from '../src/app/domain-writes.js';
describe('Presentation preparation, local definitions and scoped access', () => {
  let f: Fixture,
    owner: Actor,
    editor: Actor,
    outsider: Actor,
    c: Awaited<ReturnType<typeof architectureContext>>;
  const post = (url: string, payload: unknown, actor = owner) =>
    f.app.inject({
      method: 'POST',
      url,
      headers: actor.headers,
      payload: payload as Record<string, unknown>,
    });
  const get = (url: string, actor = owner) => f.app.inject({ url, headers: actor.headers });
  const url = (id: string) => '/api/v1/presentations/' + id;
  const builder = async (id: string, actor = owner) => (await get(url(id), actor)).json().data;
  const scope = () => ({
    format: 1 as const,
    kind: 'WHOLE_ARCHITECTURE' as const,
    architectureId: c.architectureId,
    architectureGraphRef: c.family.rootGraphId,
    architectureStamp: 1,
  });
  const nodeVisual = {
    state: 'FAILURE',
    emphasis: 'HIGHLIGHT',
    scale: 1.3,
    depth: 'FORWARD',
    opacity: 0.8,
    color: 'FAILURE',
    marker: 'WARNING',
    visible: true,
    label: 'Database failure',
    pulse: false,
  };
  const edgeVisual = {
    state: 'BROKEN',
    style: 'DASHED',
    emphasis: 'HIGHLIGHT',
    marker: 'CROSS',
    visible: true,
    activity: 'STATIC',
    color: 'FAILURE',
    label: 'Failure path',
  };
  const create = async () => {
    const res = await post('/api/v1/presentations', {
      operationId: op(),
      projectId: c.projectId,
      name: 'Reliability',
      purpose: 'Architecture walkthrough',
    });
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data.id as string;
  };
  const add = async (id: string, extra: Record<string, unknown> = {}, actor = owner) => {
    const state = await builder(id, actor);
    return post(
      url(id) + '/screens',
      {
        operationId: op(),
        expectedStamp: state.changeStamp,
        name: 'Failure flow',
        type: 'FAILURE',
        scope: scope(),
        scenarioGoal: 'Explain recovery',
        notes: 'Manual authoring',
        understanding: {
          summary: 'A database failure delays processing.',
          points: ['Worker retries later'],
        },
        ...extra,
      },
      actor,
    );
  };
  const command = async (
    id: string,
    screenId: string,
    action: Record<string, unknown>,
    actor = owner,
  ) => {
    const state = await builder(id, actor),
      screen = state.screens.find((s: { id: string }) => s.id === screenId);
    return post(
      url(id) + '/screens/' + screenId + '/commands',
      { operationId: op(), expectedStamp: screen.changeStamp, ...action },
      actor,
    );
  };
  const accepted = async (id: string) => {
    const added = await add(id);
    expect(added.statusCode, added.body).toBe(200);
    const screenId = added.json().data.id as string;
    expect((await command(id, screenId, { action: 'ACCEPT_UNDERSTANDING' })).statusCode).toBe(200);
    return screenId;
  };
  const invite = async (id: string, actor: Actor, role = 'COLLABORATOR') => {
    const state = await builder(id),
      res = await post(url(id) + '/invitations', {
        operationId: op(),
        expectedStamp: state.changeStamp,
        email: actor === editor ? 'editor@example.com' : 'outsider@example.com',
        role,
        expiresInDays: 3,
      });
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data.id as string;
  };
  const accept = async (id: string, actor: Actor, role = 'COLLABORATOR') => {
    const invitationId = await invite(id, actor, role);
    const res = await post(
      url(id) + '/invitations/' + invitationId + '/respond',
      { operationId: op(), action: 'ACCEPT' },
      actor,
    );
    expect(res.statusCode, res.body).toBe(200);
    return invitationId;
  };
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    c = await architectureContext(f, owner);
    expect(
      (await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 })).statusCode,
    ).toBe(200);
  });
  afterAll(async () => {
    await f?.close();
  });
  it('requires confirmed Architecture and stored project owner authority', async () => {
    const candidate = await architectureContext(f, owner);
    expect(
      (
        await post('/api/v1/presentations', {
          operationId: op(),
          projectId: candidate.projectId,
          name: 'No',
          purpose: 'Candidate',
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await post(
          '/api/v1/presentations',
          { operationId: op(), projectId: c.projectId, name: 'No', purpose: 'Other' },
          editor,
        )
      ).statusCode,
    ).toBe(404);
  });
  it('creates multiple Presentations, exactly one protected base, and no canonical copy', async () => {
    const before = (await get(c.url)).json().data,
      one = await create(),
      two = await create();
    expect(one).not.toBe(two);
    const p = await builder(one);
    expect(p).toMatchObject({
      architectureId: c.architectureId,
      projectId: c.projectId,
      role: 'OWNER',
      state: 'READY',
      changeStamp: 0,
    });
    expect(p.screens).toHaveLength(1);
    expect(p.screens[0]).toMatchObject({
      kind: 'MAIN_ARCHITECTURE',
      meetingEligible: true,
      state: 'CONFIRMED',
    });
    expect(p.architecture.graphs[0]).not.toHaveProperty('sourceReferenceIds');
    expect(p.architecture.graphs[0].nodes[0]).not.toHaveProperty('sourceReferenceIds');
    expect((await get(c.url)).json().data).toEqual(before);
    expect(
      (await get('/api/v1/presentations'))
        .json()
        .data.items.some((x: { id: string }) => x.id === one),
    ).toBe(true);
  });
  it('creation replay preserves Presentation/base identity', async () => {
    const body = { operationId: op(), projectId: c.projectId, name: 'Intent', purpose: 'Review' },
      first = await post('/api/v1/presentations', body),
      retry = await post('/api/v1/presentations', body);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    expect(
      (
        await f.pool.query('select id from presentation_screens where presentation_id=$1', [
          first.json().data.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it('forbids rebinding and removing or changing Main Architecture', async () => {
    const id = await create(),
      p = await builder(id),
      base = p.screens[0].id;
    expect((await command(id, base, { action: 'DELETE' })).statusCode).toBe(409);
    expect(
      (
        await post(url(id) + '/commands', {
          operationId: op(),
          expectedStamp: 0,
          action: 'SETUP',
          name: 'New',
          purpose: 'X',
          architectureId: op(),
        })
      ).statusCode,
    ).toBe(400);
    await expect(
      f.pool.query('update presentations set architecture_id=$1 where id=$2', [op(), id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('update presentation_screens set deleted_at=now() where id=$1', [base]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('denies unauthorized readers and keeps private invitation metadata owner-only', async () => {
    const id = await create();
    expect((await get(url(id), outsider)).statusCode).toBe(404);
    expect((await get('/api/v1/presentations', outsider)).json().data.count).toBe(0);
    await accept(id, outsider, 'VIEWER');
    const p = await builder(id, outsider);
    expect(p.role).toBe('VIEWER');
    expect(p).not.toHaveProperty('access');
  });
  it('collaborator can edit drafts but gets no Project/editor/canonical/lifecycle authority', async () => {
    const id = await create(),
      before = (
        await f.pool.query(
          'select (select count(*) from organization_members) members,(select count(*) from project_editors) editors',
        )
      ).rows[0];
    await accept(id, editor);
    const screen = (await add(id, {}, editor)).json().data.id;
    expect((await command(id, screen, { action: 'ACCEPT_UNDERSTANDING' }, editor)).statusCode).toBe(
      200,
    );
    expect((await command(id, screen, { action: 'CONFIRM' }, editor)).statusCode).toBe(403);
    expect((await get(c.url, editor)).statusCode).toBe(404);
    expect((await get('/api/v1/projects/' + c.projectId, editor)).statusCode).toBe(403);
    const p = await builder(id, editor);
    expect(
      (
        await post(
          url(id) + '/invitations',
          {
            operationId: op(),
            expectedStamp: p.changeStamp,
            email: 'new@example.com',
            role: 'VIEWER',
            expiresInDays: 3,
          },
          editor,
        )
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await f.pool.query(
          'select (select count(*) from organization_members) members,(select count(*) from project_editors) editors',
        )
      ).rows[0],
    ).toEqual(before);
  });
  it('viewer is read-only, including saved selection', async () => {
    const id = await create();
    await accept(id, outsider, 'VIEWER');
    expect((await add(id, {}, outsider)).statusCode).toBe(403);
    const p = await builder(id, outsider);
    expect(
      (
        await post(
          url(id) + '/commands',
          {
            operationId: op(),
            expectedStamp: p.changeStamp,
            action: 'SELECT',
            screenId: p.screens[0].id,
          },
          outsider,
        )
      ).statusCode,
    ).toBe(403);
  });
  it('accepts invitation once and idempotently returns result; cancellation/decline/expiry are terminal', async () => {
    const id = await create(),
      invitationId = await invite(id, editor),
      body = { operationId: op(), action: 'ACCEPT' };
    const first = await post(url(id) + '/invitations/' + invitationId + '/respond', body, editor),
      retry = await post(url(id) + '/invitations/' + invitationId + '/respond', body, editor);
    expect(first.json().data.state).toBe('ACCEPTED');
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    expect(
      (
        await f.pool.query('select id from presentation_access_grants where presentation_id=$1', [
          id,
        ])
      ).rowCount,
    ).toBe(1);
    for (const action of ['DECLINE', 'CANCEL', 'EXPIRE']) {
      const p = await create(),
        inv = await invite(p, outsider);
      if (action === 'EXPIRE')
        await f.pool.query(
          "update presentation_invitations set expires_at=now()-interval '1 second' where id=$1",
          [inv],
        );
      const response = await post(
        url(p) + '/invitations/' + inv + '/respond',
        { operationId: op(), action: action === 'EXPIRE' ? 'ACCEPT' : action },
        action === 'CANCEL' ? owner : outsider,
      );
      expect(response.json().data.state).toBe(
        action === 'EXPIRE' ? 'EXPIRED' : action === 'DECLINE' ? 'DECLINED' : 'CANCELLED',
      );
      expect(
        (
          await f.pool.query('select id from presentation_access_grants where presentation_id=$1', [
            p,
          ])
        ).rowCount,
      ).toBe(0);
    }
  });
  it('invitation recipient and current grant revocation enforced', async () => {
    const id = await create(),
      inv = await invite(id, editor);
    expect(
      (
        await post(
          url(id) + '/invitations/' + inv + '/respond',
          { operationId: op(), action: 'ACCEPT' },
          outsider,
        )
      ).statusCode,
    ).toBe(404);
    await post(
      url(id) + '/invitations/' + inv + '/respond',
      { operationId: op(), action: 'ACCEPT' },
      editor,
    );
    const p = await builder(id);
    expect(
      (
        await post(url(id) + '/commands', {
          operationId: op(),
          expectedStamp: p.changeStamp,
          action: 'REVOKE',
          grantId: p.access.grants[0].id,
        })
      ).statusCode,
    ).toBe(200);
    expect((await get(url(id), editor)).statusCode).toBe(404);
  });
  it('trusted guest admission is presentation-scoped, expires/revokes and creates no User/member', async () => {
    const id = await create(),
      other = await create(),
      service = new PresentationService(f.db, domainWrites(f.db, f.config)),
      principal = await authenticatedPrincipal(f, owner);
    const before = (
      await f.pool.query(
        'select (select count(*) from users) u,(select count(*) from organization_members) m,(select count(*) from project_editors) e',
      )
    ).rows[0];
    const issued = await service.provisionGuest(
      principal,
      id,
      'COLLABORATOR',
      new Date(Date.now() + 3600000),
    );
    const guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    expect((await get(url(id), guest)).statusCode).toBe(200);
    expect((await add(id, {}, guest)).statusCode).toBe(200);
    expect((await get(url(other), guest)).statusCode).toBe(401);
    expect((await get('/api/v1/projects/' + c.projectId, guest)).statusCode).toBe(401);
    await f.pool.query(
      "update scoped_guest_access set expires_at=now()-interval '1 second' where id=$1",
      [issued.actor.kind === 'SCOPED_GUEST' ? issued.actor.guestId : op()],
    );
    expect((await get(url(id), guest)).statusCode).toBe(401);
    expect(
      (
        await f.pool.query(
          'select (select count(*) from users) u,(select count(*) from organization_members) m,(select count(*) from project_editors) e',
        )
      ).rows[0],
    ).toEqual(before);
  });
  it.each(['ARCHITECTURE_OVERVIEW', 'DISCUSSION', 'SUCCESS', 'FAILURE', 'RECOVERY', 'CUSTOM'])(
    'creates bounded %s draft, scenario acceptance is separate',
    async (type) => {
      const id = await create(),
        response = await add(id, { type });
      expect(response.statusCode, response.body).toBe(200);
      const screenId = response.json().data.id;
      expect(
        (await builder(id)).screens.find((s: { id: string }) => s.id === screenId),
      ).toMatchObject({
        state: 'DRAFT',
        meetingEligible: false,
        draft: { understandingAccepted: false },
      });
      expect((await command(id, screenId, { action: 'CONFIRM' })).statusCode).toBe(409);
      expect((await command(id, screenId, { action: 'ACCEPT_UNDERSTANDING' })).statusCode).toBe(
        200,
      );
      expect(
        (await builder(id)).screens.find((s: { id: string }) => s.id === screenId).meetingEligible,
      ).toBe(false);
    },
  );
  it('accepts lasso scope and rejects invalid/stale/cross-family/unsupported scope', async () => {
    const id = await create(),
      g = c.family.graphs[0]!,
      lasso = {
        ...scope(),
        kind: 'LASSO_GROUP',
        selectedNodeRefs: [g.nodes[0]!.id],
        internalConnectionRefs: [],
        boundaryConnectionRefs: [g.connections[0]!.id],
        externalBoundaryEndpointRefs: [g.nodes[1]!.id],
      };
    expect((await add(id, { scope: lasso })).statusCode).toBe(200);
    for (const invalid of [
      { ...lasso, externalBoundaryEndpointRefs: [] },
      { ...scope(), architectureStamp: 0 },
      { ...scope(), architectureId: op() },
      { ...scope(), kind: 'NODE', nodeRef: g.nodes[0]!.id },
    ]) {
      expect([400, 409]).toContain((await add(id, { scope: invalid })).statusCode);
    }
  });
  it('scope update resets acceptance and incompatible visual state without canonical mutation', async () => {
    const id = await create(),
      s = await accepted(id),
      before = (await get(c.url)).json().data;
    await command(id, s, {
      action: 'NODE_VISUAL',
      nodeId: c.family.graphs[0]!.nodes[0]!.id,
      visual: nodeVisual,
    });
    expect((await command(id, s, { action: 'SCOPE', scope: scope() })).statusCode).toBe(200);
    expect((await builder(id)).screens.find((x: { id: string }) => x.id === s).draft).toMatchObject(
      { understandingAccepted: false, nodeOverrides: [], connectionOverrides: [] },
    );
    expect((await get(c.url)).json().data).toEqual(before);
  });
  it('applies/resets local node/edge visuals and leaves canonical truth unchanged', async () => {
    const id = await create(),
      s = await accepted(id),
      before = (await get(c.url)).json().data,
      g = c.family.graphs[0]!;
    expect(
      (await command(id, s, { action: 'NODE_VISUAL', nodeId: g.nodes[0]!.id, visual: nodeVisual }))
        .statusCode,
    ).toBe(200);
    expect(
      (
        await command(id, s, {
          action: 'CONNECTION_VISUAL',
          connectionId: g.connections[0]!.id,
          visual: edgeVisual,
        })
      ).statusCode,
    ).toBe(200);
    const draft = (await builder(id)).screens.find((x: { id: string }) => x.id === s).draft;
    expect(draft.nodeOverrides[0].visual).toEqual(nodeVisual);
    expect(draft.connectionOverrides[0].visual).toEqual(edgeVisual);
    expect((await command(id, s, { action: 'RESET_VISUALS' })).statusCode).toBe(200);
    expect(
      (await builder(id)).screens.find((x: { id: string }) => x.id === s).draft.nodeOverrides,
    ).toEqual([]);
    expect((await get(c.url)).json().data).toEqual(before);
  });
  it.each(['unknown-node', 'cross-graph-node', 'unknown-edge', 'scale', 'raw-style'])(
    'rejects invalid visual %s',
    async (variant) => {
      const id = await create(),
        s = await accepted(id),
        g = c.family.graphs[0]!;
      let action: Record<string, unknown> = {
        action: 'NODE_VISUAL',
        nodeId: g.nodes[0]!.id,
        visual: nodeVisual,
      };
      if (variant === 'unknown-node') action.nodeId = op();
      if (variant === 'cross-graph-node') action.nodeId = c.family.graphs[1]!.nodes[0]!.id;
      if (variant === 'unknown-edge')
        action = { action: 'CONNECTION_VISUAL', connectionId: op(), visual: edgeVisual };
      if (variant === 'scale') action.visual = { ...nodeVisual, scale: 100 };
      if (variant === 'raw-style') action.visual = { ...nodeVisual, shader: 'arbitrary' };
      expect((await command(id, s, action)).statusCode).toBe(400);
    },
  );
  it('creates/deletes only screen-local overlays and rejects invalid endpoints atomically', async () => {
    const id = await create(),
      s = await accepted(id),
      g = c.family.graphs[0]!,
      before = (await get(c.url)).json().data;
    expect(
      (
        await command(id, s, {
          action: 'ADD_OVERLAY',
          sourceNodeId: g.nodes[1]!.id,
          destinationNodeId: g.nodes[0]!.id,
          label: 'Hypothetical retry',
          visual: edgeVisual,
        })
      ).statusCode,
    ).toBe(200);
    const screen = (await builder(id)).screens.find((x: { id: string }) => x.id === s);
    expect(screen.overlays).toHaveLength(1);
    expect(
      (
        await command(id, s, {
          action: 'ADD_OVERLAY',
          sourceNodeId: op(),
          destinationNodeId: g.nodes[0]!.id,
          label: 'Invalid',
          visual: edgeVisual,
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await command(id, s, { action: 'DELETE_OVERLAY', overlayId: screen.overlays[0].id }))
        .statusCode,
    ).toBe(200);
    expect((await get(c.url)).json().data).toEqual(before);
  });
  it('explicit Knowledge inclusion freezes selected representation, not private origin or future edits', async () => {
    const id = await create(),
      s = await accepted(id);
    const item = (
      await post('/api/v1/knowledge', {
        operationId: op(),
        projectId: c.projectId,
        category: 'QUESTION',
        title: 'Retry policy',
        body: 'Who owns retry?',
        attachments: [{ kind: 'SOURCE_REFERENCE', sourceReferenceId: c.referenceId }],
      })
    ).json().data.id;
    expect(
      (
        await command(id, s, {
          action: 'INCLUDE_KNOWLEDGE',
          itemId: item,
          expectedItemStamp: 0,
          includeBody: true,
        })
      ).statusCode,
    ).toBe(200);
    const confirmed = await command(id, s, { action: 'CONFIRM' });
    expect(confirmed.statusCode, confirmed.body).toBe(200);
    const defId = confirmed.json().data.id;
    await accept(id, outsider, 'VIEWER');
    expect((await get('/api/v1/knowledge/' + item, outsider)).statusCode).toBe(404);
    const definition = (await get(url(id) + '/definitions/' + defId, outsider)).json().data;
    expect(definition.definition.inclusions[0].representation).toMatchObject({
      body: 'Who owns retry?',
    });
    expect(definition.definition.inclusions[0]).not.toHaveProperty('originId');
    expect(definition.definition.inclusions[0].representation).not.toHaveProperty('attachments');
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: '/api/v1/knowledge/' + item,
          headers: owner.headers,
          payload: {
            expectedStamp: 0,
            category: 'QUESTION',
            title: 'Changed private',
            body: 'Private later change',
            attachments: [],
          },
        })
      ).statusCode,
    ).toBe(200);
    expect((await get(url(id) + '/definitions/' + defId, outsider)).json().data).toEqual(
      definition,
    );
    expect(
      (await builder(id, outsider)).screens.find((x: { id: string }) => x.id === s).inclusions[0]
        .representation.body,
    ).toBe('Who owns retry?');
  });
  it('denies unauthorized private inclusion and bounds evidence/Snapshot inclusion to author/project', async () => {
    const id = await create(),
      s = await accepted(id),
      privateItem = (
        await post(
          '/api/v1/knowledge',
          { operationId: op(), category: 'NOTE', title: 'Secret', body: 'Private' },
          editor,
        )
      ).json().data.id;
    expect(
      (
        await command(id, s, {
          action: 'INCLUDE_KNOWLEDGE',
          itemId: privateItem,
          expectedItemStamp: 0,
          includeBody: true,
        })
      ).statusCode,
    ).toBe(404);
    const snapshot = (
      await post('/api/v1/snapshots', {
        operationId: op(),
        projectId: c.projectId,
        scope: scope(),
        payload: { format: 1, title: 'Capture' },
      })
    ).json().data.id;
    expect(
      (await command(id, s, { action: 'INCLUDE_SNAPSHOT', snapshotId: snapshot })).statusCode,
    ).toBe(200);
    expect(
      (await command(id, s, { action: 'INCLUDE_SOURCE', sourceReferenceId: c.referenceId }))
        .statusCode,
    ).toBe(200);
    const state = await builder(id),
      entry = state.screens.find((x: { id: string }) => x.id === s).inclusions[0];
    expect(
      (await command(id, s, { action: 'REMOVE_INCLUSION', inclusionId: entry.id })).statusCode,
    ).toBe(200);
  });
  it('owner confirms exact draft, retries same definition, edits invalidate eligibility and reconfirm new identity', async () => {
    const id = await create(),
      s = await accepted(id),
      screen = (await builder(id)).screens.find((x: { id: string }) => x.id === s),
      body = { operationId: op(), expectedStamp: screen.changeStamp, action: 'CONFIRM' };
    const first = await post(url(id) + '/screens/' + s + '/commands', body),
      defId = first.json().data.id;
    const original = (await get(url(id) + '/definitions/' + defId)).json().data;
    expect(first.statusCode, first.body).toBe(200);
    expect((await post(url(id) + '/screens/' + s + '/commands', body)).json().data).toEqual({
      ...first.json().data,
      replayed: true,
    });
    expect(
      (
        await command(id, s, {
          action: 'EDIT',
          name: 'Updated failure',
          scenarioGoal: 'Updated scenario',
          notes: 'New',
          understanding: { summary: 'Manual revision', points: [] },
        })
      ).statusCode,
    ).toBe(200);
    const current = (await builder(id)).screens.find((x: { id: string }) => x.id === s);
    expect(current).toMatchObject({
      state: 'DRAFT',
      meetingEligible: false,
      lastConfirmedDefinitionId: defId,
      draft: { understandingAccepted: false },
    });
    expect((await get(url(id) + '/definitions/' + defId)).json().data).toEqual(original);
    await command(id, s, { action: 'ACCEPT_UNDERSTANDING' });
    const next = await command(id, s, { action: 'CONFIRM' });
    expect(next.json().data.id).not.toBe(defId);
    await expect(
      f.pool.query("update presentation_screen_definitions set definition='{}' where id=$1", [
        defId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('concurrent stale edits admit one and stale confirmation cannot overwrite newer draft', async () => {
    const id = await create(),
      s = await accepted(id),
      current = (await builder(id)).screens.find((x: { id: string }) => x.id === s);
    const send = (label: string) =>
      post(url(id) + '/screens/' + s + '/commands', {
        operationId: op(),
        expectedStamp: current.changeStamp,
        action: 'NODE_VISUAL',
        nodeId: c.family.graphs[0]!.nodes[0]!.id,
        visual: { ...nodeVisual, label },
      });
    expect((await Promise.all([send('A'), send('B')])).map((r) => r.statusCode).sort()).toEqual([
      200, 409,
    ]);
    expect(
      (
        await post(url(id) + '/screens/' + s + '/commands', {
          operationId: op(),
          expectedStamp: current.changeStamp,
          action: 'CONFIRM',
        })
      ).statusCode,
    ).toBe(409);
    expect((await builder(id)).screens.find((x: { id: string }) => x.id === s).state).toBe('DRAFT');
  });
  it('failed definition insert rolls back eligibility, pointer, stamp and operation receipt', async () => {
    const id = await create(),
      s = await accepted(id),
      before = await builder(id),
      operationId = op(),
      screen = before.screens.find((x: { id: string }) => x.id === s);
    await f.pool.query(
      "CREATE FUNCTION step4_fail_definition() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$; CREATE TRIGGER step4_fail_definition BEFORE INSERT ON presentation_screen_definitions FOR EACH ROW EXECUTE FUNCTION step4_fail_definition();",
    );
    try {
      expect(
        (
          await post(url(id) + '/screens/' + s + '/commands', {
            operationId,
            expectedStamp: screen.changeStamp,
            action: 'CONFIRM',
          })
        ).statusCode,
      ).toBe(500);
    } finally {
      await f.pool.query(
        'DROP TRIGGER step4_fail_definition ON presentation_screen_definitions; DROP FUNCTION step4_fail_definition();',
      );
    }
    expect(await builder(id)).toEqual(before);
    expect(
      (await f.pool.query('select id from operation_results where id=$1', [operationId])).rowCount,
    ).toBe(0);
  });
  it('reorder/selection are scoped and deleted authored screens retain historical definitions', async () => {
    const id = await create(),
      s = await accepted(id),
      confirmation = await command(id, s, { action: 'CONFIRM' }),
      defId = confirmation.json().data.id;
    let p = await builder(id),
      base = p.screens[0].id;
    expect(
      (
        await post(url(id) + '/commands', {
          operationId: op(),
          expectedStamp: p.changeStamp,
          action: 'ORDER',
          screenIds: [base, s],
        })
      ).statusCode,
    ).toBe(200);
    p = await builder(id);
    expect(
      (
        await post(url(id) + '/commands', {
          operationId: op(),
          expectedStamp: p.changeStamp,
          action: 'SELECT',
          screenId: s,
        })
      ).statusCode,
    ).toBe(200);
    expect((await command(id, s, { action: 'DELETE' })).statusCode).toBe(200);
    p = await builder(id);
    expect(p.screens).toHaveLength(1);
    expect(p.selectedScreenId).toBe(base);
    expect((await get(url(id) + '/definitions/' + defId)).statusCode).toBe(200);
  });

  it('setup and screen intent replay are stamped; manual acceptance cannot be forged in create input', async () => {
    const id = await create(),
      p = await builder(id),
      body = {
        operationId: op(),
        expectedStamp: p.changeStamp,
        action: 'SETUP',
        name: 'Renamed',
        purpose: 'Design review',
      };
    expect((await post(url(id) + '/commands', body)).statusCode).toBe(200);
    expect((await post(url(id) + '/commands', body)).json().data.replayed).toBe(true);
    expect((await add(id, { understandingAccepted: true })).statusCode).toBe(400);
    expect((await add(id, { type: 'MAIN_ARCHITECTURE' })).statusCode).toBe(400);
    const current = await builder(id),
      addBody = {
        operationId: op(),
        expectedStamp: current.changeStamp,
        name: 'Intent screen',
        type: 'CUSTOM',
        scope: scope(),
        scenarioGoal: 'Explain',
        notes: '',
        understanding: { summary: 'Human definition', points: [] },
      };
    const first = await post(url(id) + '/screens', addBody),
      retry = await post(url(id) + '/screens', addBody);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
  });
  it('stale Knowledge inclusion and cross-project evidence fail without partial screen writes', async () => {
    const id = await create(),
      s = await accepted(id),
      item = (
        await post('/api/v1/knowledge', {
          operationId: op(),
          category: 'NOTE',
          title: 'Intent note',
          body: 'Original',
        })
      ).json().data.id;
    await f.app.inject({
      method: 'PUT',
      url: '/api/v1/knowledge/' + item,
      headers: owner.headers,
      payload: { expectedStamp: 0, category: 'NOTE', title: 'Edited', body: 'Edited' },
    });
    const before = await builder(id);
    expect(
      (
        await command(id, s, {
          action: 'INCLUDE_KNOWLEDGE',
          itemId: item,
          expectedItemStamp: 0,
          includeBody: true,
        })
      ).statusCode,
    ).toBe(409);
    const other = await architectureContext(f, owner);
    expect(
      (await command(id, s, { action: 'INCLUDE_SOURCE', sourceReferenceId: other.referenceId }))
        .statusCode,
    ).toBe(404);
    expect(await builder(id)).toEqual(before);
  });
  it('another private Snapshot cannot be included by Presentation owner', async () => {
    const id = await create(),
      s = await accepted(id),
      other = await architectureContext(f, editor);
    await post(other.url + '/confirm', { operationId: op(), expectedStamp: 0 }, editor);
    const capture = (
      await post(
        '/api/v1/snapshots',
        {
          operationId: op(),
          projectId: other.projectId,
          scope: {
            ...scope(),
            architectureId: other.architectureId,
            architectureGraphRef: other.family.rootGraphId,
          },
          payload: { format: 1, title: 'Private capture' },
        },
        editor,
      )
    ).json().data.id;
    expect(
      (await command(id, s, { action: 'INCLUDE_SNAPSHOT', snapshotId: capture })).statusCode,
    ).toBe(404);
  });
  it('guest collaborator cannot confirm/invite/include private origin; grant revocation closes access', async () => {
    const id = await create(),
      s = await accepted(id),
      service = new PresentationService(f.db, domainWrites(f.db, f.config)),
      issued = await service.provisionGuest(
        await authenticatedPrincipal(f, owner),
        id,
        'COLLABORATOR',
        new Date(Date.now() + 3600000),
      ),
      guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    expect((await command(id, s, { action: 'CONFIRM' }, guest)).statusCode).toBe(403);
    expect(
      (await command(id, s, { action: 'INCLUDE_SOURCE', sourceReferenceId: c.referenceId }, guest))
        .statusCode,
    ).toBe(403);
    const p = await builder(id);
    expect(
      (
        await post(
          url(id) + '/invitations',
          {
            operationId: op(),
            expectedStamp: p.changeStamp,
            email: 'nobody@example.com',
            role: 'VIEWER',
            expiresInDays: 2,
          },
          guest,
        )
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await post(url(id) + '/commands', {
          operationId: op(),
          expectedStamp: p.changeStamp,
          action: 'REVOKE',
          grantId: issued.grantId,
        })
      ).statusCode,
    ).toBe(200);
    expect((await get(url(id), guest)).statusCode).toBe(404);
  });
  it('guest read rechecks expiry after waiting for presentation lock', async () => {
    const id = await create(),
      service = new PresentationService(f.db, domainWrites(f.db, f.config)),
      expiresAt = new Date(Date.now() + 1500),
      issued = await service.provisionGuest(
        await authenticatedPrincipal(f, owner),
        id,
        'VIEWER',
        expiresAt,
      ),
      guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    const blocker = await f.pool.connect();
    await blocker.query('BEGIN');
    await blocker.query('select id from presentations where id=$1 for update', [id]);
    const pending = get(url(id), guest);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, expiresAt.getTime() - Date.now() + 100)),
      );
    } finally {
      await blocker.query('COMMIT');
      blocker.release();
    }
    expect((await pending).statusCode).toBe(401);
  });
  it('overlay IDs cannot operate across screens and soft deletion retains pinned overlay definitions', async () => {
    const id = await create(),
      one = await accepted(id),
      two = await accepted(id),
      g = c.family.graphs[0]!;
    await command(id, one, {
      action: 'ADD_OVERLAY',
      sourceNodeId: g.nodes[0]!.id,
      destinationNodeId: g.nodes[1]!.id,
      label: 'Scenario',
      visual: edgeVisual,
    });
    const screen = (await builder(id)).screens.find((x: { id: string }) => x.id === one),
      overlayId = screen.overlays[0].id;
    expect((await command(id, two, { action: 'DELETE_OVERLAY', overlayId })).statusCode).toBe(404);
    const confirmed = await command(id, one, { action: 'CONFIRM' }),
      definitionId = confirmed.json().data.id;
    expect((await command(id, one, { action: 'DELETE' })).statusCode).toBe(200);
    expect(
      (await get(url(id) + '/definitions/' + definitionId)).json().data.definition.overlays[0].id,
    ).toBe(overlayId);
  });

  it.each(['overlay', 'inclusion'] as const)(
    'confirmation rejects invalid persisted %s representation without freezing',
    async (variant) => {
      const id = await create(),
        s = await accepted(id),
        before = (await builder(id)).screens.find((x: { id: string }) => x.id === s);
      if (variant === 'overlay') {
        const g = c.family.graphs[0]!;
        await f.pool.query(
          'insert into scenario_overlay_connections(screen_id,payload) values($1,$2)',
          [
            s,
            {
              sourceNodeId: g.nodes[0]!.id,
              destinationNodeId: g.nodes[1]!.id,
              label: 'Bad',
              visual: { ...edgeVisual, state: 'UNSUPPORTED' },
            },
          ],
        );
      } else {
        await f.pool.query(
          'insert into presentation_screen_knowledge_references(screen_id,kind,origin_id,included_by_user_id,representation) values($1,$2,$3,$4,$5)',
          [
            s,
            'KNOWLEDGE',
            op(),
            owner.id,
            {
              category: 'NOTE',
              title: 'Unsafe',
              body: 'Not a permitted representation',
              author: { kind: 'USER', userId: owner.id },
              privateHistory: ['must not publish'],
            },
          ],
        );
      }
      expect((await command(id, s, { action: 'CONFIRM' })).statusCode).toBe(400);
      const current = (await builder(id)).screens.find((x: { id: string }) => x.id === s);
      expect(current).toMatchObject({
        state: 'DRAFT',
        meetingEligible: false,
        changeStamp: before.changeStamp,
        lastConfirmedDefinitionId: null,
      });
      expect(
        (
          await f.pool.query('select id from presentation_screen_definitions where screen_id=$1', [
            s,
          ])
        ).rowCount,
      ).toBe(0);
    },
  );
});
