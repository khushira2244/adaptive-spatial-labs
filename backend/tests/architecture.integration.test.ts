import { beforeAll, afterAll, it, expect, describe } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { architectureContext, sourceContext, proposal, op } from './step2.fixture.js';
import type { GraphFamily } from '../src/modules/architecture/architecture.input.js';
describe('Architecture deterministic commands and freeze', () => {
  let f: Fixture, owner: Actor, editor: Actor, outsider: Actor;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
  });
  afterAll(async () => {
    await f?.close();
  });
  const post = (url: string, payload: unknown, actor = owner) =>
    f.app.inject({
      method: 'POST',
      url,
      headers: actor.headers,
      payload: payload as Record<string, unknown>,
    });
  const read = (url: string, actor = owner) => f.app.inject({ url, headers: actor.headers });
  const edit = (url: string, action: Record<string, unknown>, expectedStamp = 0) =>
    post(url + '/corrections', { operationId: op(), expectedStamp, ...action });
  it('imports one source-backed candidate family and reads documented depth', async () => {
    const c = await architectureContext(f, owner);
    const result = (await read(c.url)).json().data;
    expect(result).toMatchObject({
      id: c.architectureId,
      state: 'CANDIDATE',
      changeStamp: 0,
      correction: { phase: 'REVIEW', undoCount: 0 },
    });
    expect(result.family.graphs).toHaveLength(2);
    expect((await read(c.url + '/graphs/' + c.family.graphs[1]!.id)).json().data.graph.name).toBe(
      'Payment internals',
    );
    expect(
      (await post(c.url, { operationId: op(), proposal: proposal(c.referenceId) })).statusCode,
    ).toBe(409);
    expect(
      (await f.pool.query('select id from architectures where project_id=$1', [c.projectId]))
        .rowCount,
    ).toBe(1);
  });
  it('replays import without duplicating graph identities', async () => {
    const c = await sourceContext(f, owner),
      url = c.base + '/architecture',
      body = { operationId: op(), proposal: proposal(c.referenceId) };
    const first = await post(url, body),
      second = await post(url, body);
    expect(first.statusCode).toBe(200);
    expect(second.json().data).toEqual({ ...first.json().data, replayed: true });
    expect(
      (
        await f.pool.query('select id from architecture_graphs where architecture_id=$1', [
          first.json().data.architectureId,
        ])
      ).rowCount,
    ).toBe(2);
  });
  it.each([
    'endpoint',
    'cross-graph',
    'provenance',
    'duplicate-root',
    'missing-root',
    'second-parent',
    'cycle',
    'foreign-child',
    'scratch',
    'visual',
  ] as const)('rejects invalid %s atomically', async (variant) => {
    const c = await sourceContext(f, owner),
      family = proposal(c.referenceId),
      root = family.graphs[0]!,
      child = family.graphs[1]!;
    let body: unknown = family;
    if (variant === 'endpoint') root.connections[0]!.destinationNodeId = op();
    if (variant === 'cross-graph') root.connections[0]!.destinationNodeId = child.nodes[0]!.id;
    if (variant === 'provenance') root.sourceReferenceIds = [op()];
    if (variant === 'duplicate-root') child.kind = 'ROOT';
    if (variant === 'missing-root') root.kind = 'INNER';
    if (variant === 'second-parent')
      family.innerLinks.push({ id: op(), parentNodeId: root.nodes[1]!.id, childGraphId: child.id });
    if (variant === 'cycle') family.innerLinks[0]!.parentNodeId = child.nodes[0]!.id;
    if (variant === 'foreign-child') family.innerLinks[0]!.childGraphId = op();
    if (variant === 'scratch') root.sourceReferenceIds = [];
    if (variant === 'visual') body = { ...family, graphs: [{ ...root, success: true }, child] };
    const response = await post(c.base + '/architecture', { operationId: op(), proposal: body });
    expect([400, 404]).toContain(response.statusCode);
    expect(
      (await f.pool.query('select id from architectures where project_id=$1', [c.projectId]))
        .rowCount,
    ).toBe(0);
  });
  it('rejects valid references from a different project', async () => {
    const c = await sourceContext(f, owner),
      other = await sourceContext(f, owner);
    expect(
      (
        await post(c.base + '/architecture', {
          operationId: op(),
          proposal: proposal(other.referenceId),
        })
      ).statusCode,
    ).toBe(404);
  });
  it('denies editor candidate read/create/correct/confirm and outsider reads', async () => {
    const c = await architectureContext(f, owner, { editorUserIds: [editor.id] });
    expect((await read(c.url, editor)).statusCode).toBe(404);
    expect((await read(c.url, outsider)).statusCode).toBe(404);
    expect(
      (await post(c.url, { operationId: op(), proposal: proposal(c.referenceId) }, editor))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await post(
          c.url + '/corrections',
          { operationId: op(), expectedStamp: 0, action: 'DONE' },
          editor,
        )
      ).statusCode,
    ).toBe(404);
    expect(
      (await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 }, editor)).statusCode,
    ).toBe(404);
  });
  it('renames, changes type and moves with stable identity and locked plane', async () => {
    const c = await architectureContext(f, owner),
      nodeId = c.family.graphs[0]!.nodes[0]!.id;
    expect(
      (await edit(c.url, { action: 'RENAME_NODE', nodeId, name: 'Processor' })).json().data
        .changeStamp,
    ).toBe(1);
    expect(
      (await edit(c.url, { action: 'CHANGE_NODE_TYPE', nodeId, type: 'API' }, 1)).statusCode,
    ).toBe(200);
    expect(
      (await edit(c.url, { action: 'MOVE_NODE', nodeId, position: { x: 7, y: -2, z: 0 } }, 2))
        .statusCode,
    ).toBe(200);
    expect(
      (await edit(c.url, { action: 'MOVE_NODE', nodeId, position: { x: 7, y: -2, z: 1 } }, 3))
        .statusCode,
    ).toBe(400);
    const node = (await read(c.url))
      .json()
      .data.family.graphs.flatMap((g: GraphFamily['graphs'][number]) => g.nodes)
      .find((n: { id: string }) => n.id === nodeId);
    expect(node).toMatchObject({
      id: nodeId,
      name: 'Processor',
      type: 'API',
      position: { x: 7, y: -2, z: 0 },
    });
  });
  it('adds/deletes nodes and incident edges; undo and redo restore exact identities', async () => {
    const c = await architectureContext(f, owner),
      graph = c.family.graphs[0]!,
      node = { ...graph.nodes[1]!, id: op(), name: 'New cache', type: 'CACHE' };
    expect((await edit(c.url, { action: 'ADD_NODE', graphId: graph.id, node })).statusCode).toBe(
      200,
    );
    const connection = { id: op(), sourceNodeId: graph.nodes[0]!.id, destinationNodeId: node.id };
    expect(
      (await edit(c.url, { action: 'ADD_CONNECTION', graphId: graph.id, connection }, 1))
        .statusCode,
    ).toBe(200);
    expect((await edit(c.url, { action: 'DELETE_NODE', nodeId: node.id }, 2)).statusCode).toBe(200);
    let current = (await read(c.url)).json().data;
    expect(
      current.family.graphs.find((g: { id: string }) => g.id === graph.id).connections,
    ).toHaveLength(1);
    expect((await edit(c.url, { action: 'UNDO' }, 3)).statusCode).toBe(200);
    current = (await read(c.url)).json().data;
    expect(
      current.family.graphs
        .find((g: { id: string }) => g.id === graph.id)
        .connections.some((e: { id: string }) => e.id === connection.id),
    ).toBe(true);
    expect((await edit(c.url, { action: 'REDO' }, 4)).statusCode).toBe(200);
    expect((await edit(c.url, { action: 'UNDO' }, 5)).statusCode).toBe(200);
    expect(
      (await edit(c.url, { action: 'DELETE_CONNECTION', connectionId: connection.id }, 6))
        .statusCode,
    ).toBe(200);
  });
  it('rejects deleting a documented inner parent, permits reparenting with stable imported identity', async () => {
    const c = await architectureContext(f, owner),
      root = c.family.graphs[0]!,
      link = c.family.innerLinks[0]!;
    expect(
      (await edit(c.url, { action: 'DELETE_NODE', nodeId: link.parentNodeId })).statusCode,
    ).toBe(400);
    expect(
      (
        await edit(c.url, {
          action: 'REPARENT_INNER',
          childGraphId: link.childGraphId,
          previousParentNodeId: link.parentNodeId,
          parentNodeId: root.nodes[1]!.id,
        })
      ).statusCode,
    ).toBe(200);
    const current = (await read(c.url)).json().data.family;
    expect(current.innerLinks).toEqual([{ ...link, parentNodeId: root.nodes[1]!.id }]);
    expect(
      (
        await edit(
          c.url,
          {
            action: 'REPARENT_INNER',
            childGraphId: link.childGraphId,
            previousParentNodeId: root.nodes[1]!.id,
            parentNodeId: c.family.graphs[1]!.nodes[0]!.id,
          },
          1,
        )
      ).statusCode,
    ).toBe(400);
  });
  it('persists checkpoint, Done returns review without confirmation, bounds undo to eight', async () => {
    const c = await architectureContext(f, owner),
      nodeId = c.family.graphs[0]!.nodes[0]!.id;
    const checkpoint = { graphId: c.family.rootGraphId, selectedNodeId: nodeId };
    expect((await edit(c.url, { action: 'CHECKPOINT', checkpoint })).statusCode).toBe(200);
    expect((await read(c.url)).json().data.correction).toMatchObject({
      phase: 'CORRECTION',
      checkpoint,
    });
    let stamp = 1;
    for (let i = 0; i < 10; i++) {
      expect(
        (await edit(c.url, { action: 'RENAME_NODE', nodeId, name: 'Payment ' + i }, stamp++))
          .statusCode,
      ).toBe(200);
    }
    expect((await read(c.url)).json().data.correction.undoCount).toBe(8);
    expect((await edit(c.url, { action: 'DONE' }, stamp)).statusCode).toBe(200);
    expect((await read(c.url)).json().data).toMatchObject({
      state: 'CANDIDATE',
      correction: { phase: 'REVIEW', checkpoint: null },
    });
  });
  it('concurrent stale writers cannot overwrite accepted state', async () => {
    const c = await architectureContext(f, owner),
      nodeId = c.family.graphs[0]!.nodes[0]!.id;
    const responses = await Promise.all(
      ['A', 'B'].map((name) => edit(c.url, { action: 'RENAME_NODE', nodeId, name })),
    );
    expect(responses.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const accepted = responses[0]!.statusCode === 200 ? 'A' : 'B';
    const current = (await read(c.url)).json().data;
    expect(current.changeStamp).toBe(1);
    expect(
      current.family.graphs
        .flatMap((g: GraphFamily['graphs'][number]) => g.nodes)
        .find((n: { id: string }) => n.id === nodeId).name,
    ).toBe(accepted);
  });
  it('stale confirmation preserves candidate and no graphs freeze', async () => {
    const c = await architectureContext(f, owner);
    await edit(c.url, { action: 'DONE' });
    expect(
      (await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 })).statusCode,
    ).toBe(409);
    expect((await read(c.url)).json().data.state).toBe('CANDIDATE');
    expect(
      (
        await f.pool.query(
          'select distinct state from architecture_graphs where architecture_id=$1',
          [c.architectureId],
        )
      ).rows,
    ).toEqual([{ state: 'CANDIDATE' }]);
  });
  it('atomic owner confirmation freezes same family, closes recovery, replays exact receipt', async () => {
    const c = await architectureContext(f, owner, { editorUserIds: [editor.id] }),
      body = { operationId: op(), expectedStamp: 0 };
    const first = await post(c.url + '/confirm', body);
    expect(first.json().data).toMatchObject({
      architectureId: c.architectureId,
      state: 'CONFIRMED',
      changeStamp: 1,
      replayed: false,
    });
    const retry = await post(c.url + '/confirm', body);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    expect((await post(c.url + '/confirm', { ...body, expectedStamp: 1 })).statusCode).toBe(409);
    const current = (await read(c.url)).json().data;
    expect(current.family.graphs.map((g: { id: string }) => g.id).sort()).toEqual(
      c.family.graphs.map((g) => g.id).sort(),
    );
    expect(current.correction).toBeNull();
    expect((await read(c.url, editor)).statusCode).toBe(200);
    expect((await read(c.url, outsider)).statusCode).toBe(404);
    expect((await edit(c.url, { action: 'DONE' }, 1)).statusCode).toBe(409);
    expect(
      (
        await f.pool.query(
          'select distinct state from architecture_graphs where architecture_id=$1',
          [c.architectureId],
        )
      ).rows,
    ).toEqual([{ state: 'CONFIRMED' }]);
  });
  it('invalid persisted provenance blocks confirmation without partial promotion', async () => {
    const c = await architectureContext(f, owner);
    await f.pool.query('delete from architecture_graph_provenance where graph_id=$1', [
      c.family.graphs[1]!.id,
    ]);
    expect(
      (await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 })).statusCode,
    ).toBe(400);
    expect((await read(c.url)).json().data.state).toBe('CANDIDATE');
    expect(
      (
        await f.pool.query(
          'select distinct state from architecture_graphs where architecture_id=$1',
          [c.architectureId],
        )
      ).rows,
    ).toEqual([{ state: 'CANDIDATE' }]);
  });
  it('database failure during child freeze rolls back root and receipt', async () => {
    const c = await architectureContext(f, owner),
      operationId = op();
    await f.pool.query(
      `CREATE FUNCTION step2_test_reject_child() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='INNER' AND NEW.state='CONFIRMED' THEN RAISE EXCEPTION 'injected failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER step2_test_child BEFORE UPDATE ON architecture_graphs FOR EACH ROW EXECUTE FUNCTION step2_test_reject_child();`,
    );
    try {
      expect((await post(c.url + '/confirm', { operationId, expectedStamp: 0 })).statusCode).toBe(
        500,
      );
    } finally {
      await f.pool.query(
        'DROP TRIGGER step2_test_child ON architecture_graphs; DROP FUNCTION step2_test_reject_child();',
      );
    }
    expect((await read(c.url)).json().data).toMatchObject({ state: 'CANDIDATE', changeStamp: 0 });
    expect(
      (
        await f.pool.query(
          'select distinct state from architecture_graphs where architecture_id=$1',
          [c.architectureId],
        )
      ).rows,
    ).toEqual([{ state: 'CANDIDATE' }]);
    expect(
      (await f.pool.query('select id from operation_results where id=$1', [operationId])).rowCount,
    ).toBe(0);
    expect((await post(c.url + '/confirm', { operationId, expectedStamp: 0 })).statusCode).toBe(
      200,
    );
  });
  it('database rejects partial family promotion and confirmed content mutation', async () => {
    const c = await architectureContext(f, owner);
    await expect(
      f.pool.query("update architecture_graphs set state='CONFIRMED' where id=$1", [
        c.family.rootGraphId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await post(c.url + '/confirm', { operationId: op(), expectedStamp: 0 });
    await expect(
      f.pool.query('update architecture_nodes set name=$1 where id=$2', [
        'tampered',
        c.family.graphs[0]!.nodes[0]!.id,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('delete from architecture_connections where id=$1', [
        c.family.graphs[0]!.connections[0]!.id,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('delete from architecture_graph_provenance where graph_id=$1', [
        c.family.rootGraphId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
});
