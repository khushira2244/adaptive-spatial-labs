import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { architectureContext as setupArchitecture, op } from './step2.fixture.js';
import type { SemanticScope } from '../src/modules/knowledge/knowledge.input.js';
describe('Knowledge/Context actor privacy and semantic captures', () => {
  let f: Fixture,
    owner: Actor,
    editor: Actor,
    outsider: Actor,
    c: Awaited<ReturnType<typeof setupArchitecture>>,
    whole: SemanticScope;
  const post = (url: string, payload: unknown, actor = owner) =>
    f.app.inject({
      method: 'POST',
      url,
      headers: actor.headers,
      payload: payload as Record<string, unknown>,
    });
  const get = (url: string, actor = owner) => f.app.inject({ url, headers: actor.headers });
  const note = (extra: Record<string, unknown> = {}, actor = owner) =>
    post(
      '/api/v1/knowledge',
      {
        operationId: op(),
        projectId: c.projectId,
        category: 'NOTE',
        title: 'Private title',
        body: 'Private body',
        ...extra,
      },
      actor,
    );
  const snap = (extra: Record<string, unknown> = {}, actor = owner) =>
    post(
      '/api/v1/snapshots',
      {
        operationId: op(),
        projectId: c.projectId,
        scope: whole,
        payload: { format: 1, title: 'Explicit capture', caption: 'Review scope' },
        ...extra,
      },
      actor,
    );
  const put = (id: string, extra: Record<string, unknown> = {}, actor = owner) =>
    f.app.inject({
      method: 'PUT',
      url: '/api/v1/knowledge/' + id,
      headers: actor.headers,
      payload: {
        expectedStamp: 0,
        category: 'NOTE',
        title: 'Edited',
        body: 'Edited body',
        ...extra,
      },
    });
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    c = await setupArchitecture(f, owner, { editorUserIds: [editor.id] });
    const result = await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 });
    expect(result.statusCode).toBe(200);
    whole = {
      format: 1,
      kind: 'WHOLE_ARCHITECTURE',
      architectureId: c.architectureId,
      architectureGraphRef: c.family.rootGraphId,
      architectureStamp: 1,
    };
  });
  afterAll(async () => {
    await f?.close();
  });
  it('creates private content, preserves author, and conditionally updates it', async () => {
    const created = await note();
    expect(created.statusCode).toBe(200);
    const id = created.json().data.id;
    const read = (await get('/api/v1/knowledge/' + id)).json().data;
    expect(read).toMatchObject({
      author: { kind: 'USER', userId: owner.id },
      projectId: c.projectId,
      visibility: 'PRIVATE',
      state: 'ACTIVE',
      changeStamp: 0,
    });
    expect((await put(id)).json().data.changeStamp).toBe(1);
    expect((await get('/api/v1/knowledge/' + id)).json().data).toMatchObject({
      title: 'Edited',
      author: read.author,
      changeStamp: 1,
    });
    expect((await put(id)).json().error.code).toBe('STALE_CHANGE_STAMP');
  });
  it('global private note works without project, but scoped attachments require project', async () => {
    const payload = {
      operationId: op(),
      category: 'QUESTION',
      title: 'Global question',
      body: 'Think about this',
    };
    const res = await post('/api/v1/knowledge', payload);
    expect(res.statusCode).toBe(200);
    expect((await get('/api/v1/knowledge/' + res.json().data.id)).json().data.projectId).toBeNull();
    expect(
      (
        await post('/api/v1/knowledge', {
          ...payload,
          operationId: op(),
          attachments: [{ kind: 'ARCHITECTURE', scope: whole }],
        })
      ).statusCode,
    ).toBe(400);
  });
  it('owner/editor/project association does not grant another author private access', async () => {
    const created = await note({ title: 'Editor secret' }, editor),
      id = created.json().data.id;
    expect(created.statusCode).toBe(200);
    for (const actor of [owner, outsider]) {
      const denied = await get('/api/v1/knowledge/' + id, actor);
      expect(denied.statusCode).toBe(404);
      expect(denied.body).not.toContain('Editor secret');
      expect((await put(id, {}, actor)).statusCode).toBe(404);
    }
    const list = await get('/api/v1/my-space?projectId=' + c.projectId, owner);
    expect(list.body).not.toContain('Editor secret');
  });
  it('private lists/counts expose no other actor metadata and no client actor filtering', async () => {
    const response = await get('/api/v1/my-space', outsider);
    expect(response.json().data).toMatchObject({ items: [], snapshots: [], count: 0 });
    expect((await get('/api/v1/knowledge?userId=' + editor.id)).statusCode).toBe(400);
    expect((await get('/api/v1/my-space?projectId=' + c.projectId, outsider)).statusCode).toBe(404);
  });
  it('same intention creates once; new intention creates new identity; changed intent conflicts', async () => {
    const payload = { operationId: op(), title: 'Intent' };
    const a = await note(payload),
      b = await note(payload),
      fresh = await note();
    expect(b.json().data).toEqual({ ...a.json().data, replayed: true });
    expect(fresh.json().data.id).not.toBe(a.json().data.id);
    expect((await note({ ...payload, body: 'Changed' })).statusCode).toBe(409);
  });
  it.each([
    { category: 'AI_FINDING' },
    { body: '' },
    { title: '' },
    { body: 'x'.repeat(16001) },
    { visibility: 'PROJECT' },
    { author: { kind: 'USER', userId: 'forged' } },
    { state: 'DELETED' },
  ])('rejects invalid or forged authored input %j', async (extra) => {
    expect((await note(extra)).statusCode).toBe(400);
  });
  it.each([
    'WHOLE_ARCHITECTURE',
    'NODE',
    'CONNECTION',
    'INNER_ARCHITECTURE',
    'LASSO_GROUP',
  ] as const)(
    'accepts valid %s owned semantic context without changing canonical truth',
    async (kind) => {
      const before = (await get(c.url)).json().data;
      let scope: SemanticScope = whole;
      const graph = c.family.graphs[0]!;
      if (kind === 'NODE') scope = { ...whole, kind, nodeRef: graph.nodes[0]!.id };
      if (kind === 'CONNECTION')
        scope = { ...whole, kind, connectionRef: graph.connections[0]!.id };
      if (kind === 'INNER_ARCHITECTURE')
        scope = {
          ...whole,
          kind,
          architectureGraphRef: c.family.graphs[1]!.id,
          parentNodeRef: c.family.innerLinks[0]!.parentNodeId,
          innerLinkRef: c.family.innerLinks[0]!.id,
        };
      if (kind === 'LASSO_GROUP')
        scope = {
          ...whole,
          kind,
          selectedNodeRefs: [graph.nodes[0]!.id],
          internalConnectionRefs: [],
          boundaryConnectionRefs: [graph.connections[0]!.id],
          externalBoundaryEndpointRefs: [graph.nodes[1]!.id],
        };
      const response = await note({ attachments: [{ kind: 'ARCHITECTURE', scope }] });
      expect(response.statusCode).toBe(200);
      const read = (await get('/api/v1/knowledge/' + response.json().data.id)).json().data;
      expect(read.attachments[0]).toMatchObject({
        descriptor: { kind: 'ARCHITECTURE', scope },
        status: 'CURRENT',
      });
      expect((await get(c.url)).json().data).toEqual(before);
    },
  );
  it.each([
    'missing-node',
    'cross-graph-node',
    'missing-connection',
    'cross-family',
    'wrong-graph',
    'wrong-inner-link',
    'stale',
    'raw-hand',
    'raw-camera',
    'future-meeting',
    'future-presentation',
  ] as const)('rejects invalid context %s', async (kind) => {
    let scope: Record<string, unknown> = { ...whole };
    if (kind === 'missing-node') scope = { ...whole, kind: 'NODE', nodeRef: op() };
    if (kind === 'cross-graph-node')
      scope = { ...whole, kind: 'NODE', nodeRef: c.family.graphs[1]!.nodes[0]!.id };
    if (kind === 'missing-connection')
      scope = { ...whole, kind: 'CONNECTION', connectionRef: op() };
    if (kind === 'cross-family') scope.architectureId = op();
    if (kind === 'wrong-graph') scope.architectureGraphRef = op();
    if (kind === 'wrong-inner-link')
      scope = {
        ...whole,
        kind: 'INNER_ARCHITECTURE',
        architectureGraphRef: c.family.graphs[1]!.id,
        parentNodeRef: c.family.innerLinks[0]!.parentNodeId,
        innerLinkRef: op(),
      };
    if (kind === 'stale') scope.architectureStamp = 0;
    if (kind === 'raw-hand') scope.handPath = [{ x: 1, y: 2, z: 3 }];
    if (kind === 'raw-camera') scope.cameraPath = [{ x: 1, y: 2, z: 3 }];
    if (kind === 'future-meeting') scope.kind = 'MEETING_CONTEXT';
    if (kind === 'future-presentation') scope.kind = 'PRESENTATION_SCREEN';
    const response = await note({ attachments: [{ kind: 'ARCHITECTURE', scope }] });
    expect([400, 404, 409]).toContain(response.statusCode);
  });
  it.each(['internal', 'boundary', 'external', 'duplicate', 'outside'] as const)(
    'rejects invalid lasso %s semantics',
    async (variant) => {
      const g = c.family.graphs[0]!,
        scope = {
          ...whole,
          kind: 'LASSO_GROUP',
          selectedNodeRefs: [g.nodes[0]!.id],
          internalConnectionRefs: [] as string[],
          boundaryConnectionRefs: [g.connections[0]!.id],
          externalBoundaryEndpointRefs: [g.nodes[1]!.id],
        };
      if (variant === 'internal') scope.internalConnectionRefs = [g.connections[0]!.id];
      if (variant === 'boundary') {
        scope.selectedNodeRefs.push(g.nodes[1]!.id);
      }
      if (variant === 'external') scope.externalBoundaryEndpointRefs = [g.nodes[0]!.id];
      if (variant === 'duplicate') scope.selectedNodeRefs.push(g.nodes[0]!.id);
      if (variant === 'outside') scope.selectedNodeRefs = [c.family.graphs[1]!.nodes[0]!.id];
      expect((await note({ attachments: [{ kind: 'ARCHITECTURE', scope }] })).statusCode).toBe(400);
    },
  );
  it('accepts internal-only lasso and preserves original connection direction by identity', async () => {
    const g = c.family.graphs[0]!,
      scope = {
        ...whole,
        kind: 'LASSO_GROUP',
        selectedNodeRefs: g.nodes.map((n) => n.id),
        internalConnectionRefs: [g.connections[0]!.id],
        boundaryConnectionRefs: [],
        externalBoundaryEndpointRefs: [],
      };
    const created = await note({ attachments: [{ kind: 'ARCHITECTURE', scope }] });
    expect(created.statusCode).toBe(200);
    const captured = (await get('/api/v1/knowledge/' + created.json().data.id)).json().data
      .attachments[0].descriptor.scope;
    expect(captured.internalConnectionRefs).toEqual([g.connections[0]!.id]);
    expect(captured).not.toHaveProperty('nodes');
    expect(captured).not.toHaveProperty('connections');
  });
  it('creates immutable semantic Snapshot; retry is same capture and new intent is distinct', async () => {
    const payload = { operationId: op() },
      a = await snap(payload),
      b = await snap(payload),
      newCapture = await snap();
    expect(a.statusCode).toBe(200);
    expect(b.json().data).toEqual({ ...a.json().data, replayed: true });
    expect(newCapture.json().data.id).not.toBe(a.json().data.id);
    const read = (await get('/api/v1/snapshots/' + a.json().data.id)).json().data;
    expect(read).toMatchObject({
      creator: { kind: 'USER', userId: owner.id },
      scope: whole,
      payload: { format: 1, title: 'Explicit capture', caption: 'Review scope' },
    });
    expect((await snap({ ...payload, payload: { format: 1, title: 'Changed' } })).statusCode).toBe(
      409,
    );
    await expect(
      f.pool.query("update snapshots set payload='{}' where id=$1", [a.json().data.id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('delete from snapshots where id=$1', [a.json().data.id]),
    ).rejects.toMatchObject({ code: '23514' });
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: '/api/v1/snapshots/' + a.json().data.id,
          headers: owner.headers,
          payload: {},
        })
      ).statusCode,
    ).toBe(404);
  });
  it('private Snapshot denies project owner and unrelated user, and remains absent from lists', async () => {
    const capture = await snap({}, editor),
      id = capture.json().data.id;
    expect(capture.statusCode).toBe(200);
    expect((await get('/api/v1/snapshots/' + id, owner)).statusCode).toBe(404);
    expect((await get('/api/v1/snapshots/' + id, outsider)).statusCode).toBe(404);
    const list = (await get('/api/v1/snapshots?projectId=' + c.projectId, owner)).json().data;
    expect(list.snapshots.some((s: { id: string }) => s.id === id)).toBe(false);
  });
  it('candidate snapshot is refused; notes retain stale context when candidate nodes are corrected/deleted', async () => {
    const candidate = await setupArchitecture(f, owner),
      graph = candidate.family.graphs[0]!,
      scope = {
        ...whole,
        architectureId: candidate.architectureId,
        architectureGraphRef: graph.id,
        architectureStamp: 0,
      };
    expect((await snap({ projectId: candidate.projectId, scope })).statusCode).toBe(409);
    const nodeScope = { ...scope, kind: 'NODE', nodeRef: graph.nodes[1]!.id };
    const item = await note({
      projectId: candidate.projectId,
      attachments: [{ kind: 'ARCHITECTURE', scope: nodeScope }],
    });
    expect(item.statusCode).toBe(200);
    expect(
      (
        await post(candidate.url + '/corrections', {
          operationId: op(),
          expectedStamp: 0,
          action: 'DELETE_NODE',
          nodeId: graph.nodes[1]!.id,
        })
      ).statusCode,
    ).toBe(200);
    const read = (await get('/api/v1/knowledge/' + item.json().data.id)).json().data;
    expect(read.attachments[0]).toMatchObject({
      descriptor: { scope: nodeScope },
      status: 'STALE',
    });
  });
  it('attaches accessible exact evidence/Snapshot without reading another actor private capture', async () => {
    const capture = await snap(),
      item = await note({
        attachments: [
          { kind: 'SOURCE_REFERENCE', sourceReferenceId: c.referenceId },
          { kind: 'SNAPSHOT', snapshotId: capture.json().data.id },
        ],
      });
    expect(item.statusCode).toBe(200);
    const read = await get('/api/v1/knowledge/' + item.json().data.id);
    expect(read.body).not.toContain('sample architecture document');
    const otherCapture = await snap({}, editor);
    expect(
      (await note({ attachments: [{ kind: 'SNAPSHOT', snapshotId: otherCapture.json().data.id }] }))
        .statusCode,
    ).toBe(404);
    const other = await setupArchitecture(f, owner);
    expect(
      (
        await note({
          attachments: [{ kind: 'SOURCE_REFERENCE', sourceReferenceId: other.referenceId }],
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await note(
          { attachments: [{ kind: 'SOURCE_REFERENCE', sourceReferenceId: c.referenceId }] },
          outsider,
        )
      ).statusCode,
    ).toBe(404);
  });
  it('replacing attachment ends old binding without repointing or modifying immutable capture', async () => {
    const capture = await snap(),
      id = (await note({ attachments: [{ kind: 'ARCHITECTURE', scope: whole }] })).json().data.id;
    const first = (await get('/api/v1/knowledge/' + id)).json().data.attachments[0];
    expect(
      (await put(id, { attachments: [{ kind: 'SNAPSHOT', snapshotId: capture.json().data.id }] }))
        .statusCode,
    ).toBe(200);
    const rows = await f.pool.query(
      'select id,descriptor,ended_at from knowledge_contexts where item_id=$1',
      [id],
    );
    expect(rows.rowCount).toBe(2);
    expect(rows.rows.find((r) => r.id === first.id)).toMatchObject({
      descriptor: first.descriptor,
    });
    expect(rows.rows.find((r) => r.id === first.id).ended_at).not.toBeNull();
    expect((await get('/api/v1/snapshots/' + capture.json().data.id)).json().data.scope).toEqual(
      whole,
    );
    await expect(
      f.pool.query("update knowledge_contexts set descriptor='{}' where id=$1", [first.id]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('concurrent edits admit one writer and preserve accepted body; invalid attachment edit rolls back', async () => {
    const id = (await note()).json().data.id;
    const responses = await Promise.all([put(id, { body: 'A' }), put(id, { body: 'B' })]);
    expect(responses.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const accepted = responses[0]!.statusCode === 200 ? 'A' : 'B';
    expect((await get('/api/v1/knowledge/' + id)).json().data).toMatchObject({
      body: accepted,
      changeStamp: 1,
    });
    expect(
      (
        await put(id, {
          expectedStamp: 1,
          attachments: [{ kind: 'SOURCE_REFERENCE', sourceReferenceId: op() }],
        })
      ).statusCode,
    ).toBe(404);
    expect((await get('/api/v1/knowledge/' + id)).json().data).toMatchObject({
      body: accepted,
      changeStamp: 1,
    });
  });
  it('scope revocation suppresses previously authored content, captures and evidence in own lists', async () => {
    const personal = await setupArchitecture(f, owner, { editorUserIds: [editor.id] });
    await post(personal.url + '/confirm', { operationId: op(), expectedStamp: 0 });
    const scope = {
      ...whole,
      architectureId: personal.architectureId,
      architectureGraphRef: personal.family.rootGraphId,
    };
    const item = (
      await note(
        {
          projectId: personal.projectId,
          title: 'Revoked item',
          attachments: [{ kind: 'SOURCE_REFERENCE', sourceReferenceId: personal.referenceId }],
        },
        editor,
      )
    ).json().data.id;
    const capture = (await snap({ projectId: personal.projectId, scope }, editor)).json().data.id;
    await f.pool.query('delete from project_editors where project_id=$1 and user_id=$2', [
      personal.projectId,
      editor.id,
    ]);
    expect((await get('/api/v1/knowledge/' + item, editor)).statusCode).toBe(404);
    expect((await get('/api/v1/snapshots/' + capture, editor)).statusCode).toBe(404);
    const list = await get('/api/v1/my-space', editor);
    expect(list.body).not.toContain('Revoked item');
    expect(list.json().data.items.some((i: { id: string }) => i.id === item)).toBe(false);
    expect(list.json().data.snapshots.some((i: { id: string }) => i.id === capture)).toBe(false);
    expect(
      (await note({ operationId: op(), projectId: personal.projectId }, editor)).statusCode,
    ).toBe(404);
  });
  it('My Space combines own eligible items/captures, supports category/graph filters without global notebook', async () => {
    const id = (
      await note({
        category: 'DISCUSSION_POINT',
        attachments: [{ kind: 'ARCHITECTURE', scope: whole }],
      })
    ).json().data.id;
    const capture = (await snap()).json().data.id;
    const list = (
      await get(
        '/api/v1/my-space?projectId=' +
          c.projectId +
          '&graphId=' +
          c.family.rootGraphId +
          '&category=DISCUSSION_POINT',
      )
    ).json().data;
    expect(list.items.some((i: { id: string }) => i.id === id)).toBe(true);
    expect(list.items.every((i: { category: string }) => i.category === 'DISCUSSION_POINT')).toBe(
      true,
    );
    expect(list.snapshots.some((i: { id: string }) => i.id === capture)).toBe(true);
    expect(list.count).toBe(list.items.length + list.snapshots.length);
    const tables = await f.pool.query(
      "select tablename from pg_tables where schemaname='public' and tablename in ('my_spaces','interaction_contexts')",
    );
    expect(tables.rowCount).toBe(0);
  });

  it('supports optional Snapshot project filing while keeping architecture access mandatory', async () => {
    const body = {
      operationId: op(),
      scope: whole,
      payload: { format: 1, title: 'Unfiled capture' },
    };
    const created = await post('/api/v1/snapshots', body);
    expect(created.statusCode).toBe(200);
    const id = created.json().data.id,
      read = (await get('/api/v1/snapshots/' + id)).json().data;
    expect(read.projectId).toBeNull();
    expect(read.scope).toEqual(whole);
    expect((await post('/api/v1/snapshots', body)).json().data).toEqual({
      ...created.json().data,
      replayed: true,
    });
    expect(
      (await post('/api/v1/snapshots', { ...body, operationId: op() }, outsider)).statusCode,
    ).toBe(404);
    expect((await note({ attachments: [{ kind: 'SNAPSHOT', snapshotId: id }] })).statusCode).toBe(
      200,
    );
    expect(
      (await get('/api/v1/my-space'))
        .json()
        .data.snapshots.some((s: { id: string }) => s.id === id),
    ).toBe(true);
  });
  it('rejects filing Snapshot under a project different from its canonical anchor', async () => {
    const other = await setupArchitecture(f, owner);
    expect((await snap({ projectId: other.projectId })).statusCode).toBe(404);
  });
  it('unfiled capture replay and private read fail after actual anchor access is revoked', async () => {
    const personal = await setupArchitecture(f, owner, { editorUserIds: [editor.id] });
    await post(personal.url + '/confirm', { operationId: op(), expectedStamp: 0 });
    const body = {
      operationId: op(),
      scope: {
        ...whole,
        architectureId: personal.architectureId,
        architectureGraphRef: personal.family.rootGraphId,
      },
      payload: { format: 1, title: 'Unfiled editor capture' },
    };
    const created = await post('/api/v1/snapshots', body, editor);
    expect(created.statusCode).toBe(200);
    await f.pool.query('delete from project_editors where project_id=$1 and user_id=$2', [
      personal.projectId,
      editor.id,
    ]);
    expect((await get('/api/v1/snapshots/' + created.json().data.id, editor)).statusCode).toBe(404);
    expect((await post('/api/v1/snapshots', body, editor)).statusCode).toBe(404);
    expect((await get('/api/v1/my-space', editor)).body).not.toContain('Unfiled editor capture');
  });
});
