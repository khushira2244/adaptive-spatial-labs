import { beforeAll, afterAll, it, expect, describe } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { sourceContext, op } from './step2.fixture.js';
describe('Sources exact provenance and ingestion', () => {
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
  it('retains exact origin; deduplicates same revision/locator and never floats history', async () => {
    const c = await sourceContext(f, owner);
    const create = (revision: string) =>
      post(c.source + '/references', {
        operationId: op(),
        revision,
        locator: { kind: 'DOCUMENT', page: 1 },
      });
    expect((await create('revision-1')).json().data.id).toBe(c.referenceId);
    const newer = (await create('revision-2')).json().data.id;
    expect(newer).not.toBe(c.referenceId);
    const list = await f.app.inject({ url: c.source + '/references', headers: owner.headers });
    expect(
      list
        .json()
        .data.map((r: { revision: string }) => r.revision)
        .sort(),
    ).toEqual(['revision-1', 'revision-2']);
  });
  it('replays reference intent and rejects changed input under the same intent', async () => {
    const c = await sourceContext(f, owner),
      body = { operationId: op(), revision: 'r3', locator: { kind: 'DOCUMENT', page: 3 } };
    const first = await post(c.source + '/references', body),
      retry = await post(c.source + '/references', body);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    expect((await post(c.source + '/references', { ...body, revision: 'r4' })).statusCode).toBe(
      409,
    );
  });
  it('denies outsider and wrong-project source access', async () => {
    const c = await sourceContext(f, owner),
      other = await sourceContext(f, owner);
    expect(
      (await f.app.inject({ url: c.source + '/references', headers: outsider.headers })).statusCode,
    ).toBe(404);
    expect(
      (
        await post(other.base + '/sources/' + c.sourceId + '/references', {
          operationId: op(),
          revision: 'x',
          locator: { kind: 'DOCUMENT' },
        })
      ).statusCode,
    ).toBe(404);
  });
  it('preserves editor source rights without granting architecture rights', async () => {
    const c = await sourceContext(f, owner, { editorUserIds: [editor.id] });
    expect(
      (
        await post(
          c.source + '/references',
          { operationId: op(), revision: 'editor', locator: { kind: 'DOCUMENT' } },
          editor,
        )
      ).statusCode,
    ).toBe(200);
  });
  it('rejects incompatible locators and unknown credential/body fields', async () => {
    const c = await sourceContext(f, owner);
    expect(
      (
        await post(c.source + '/references', {
          operationId: op(),
          revision: 'x',
          locator: { kind: 'MIRO', boardId: 'a' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await post(c.source + '/references', {
          operationId: op(),
          revision: 'x',
          locator: { kind: 'DOCUMENT' },
          token: 'secret',
        })
      ).statusCode,
    ).toBe(400);
  });
  it('database rejects source reference update and delete', async () => {
    const c = await sourceContext(f, owner);
    await expect(
      f.pool.query('update source_references set revision=$1 where id=$2', [
        'latest',
        c.referenceId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('delete from source_references where id=$1', [c.referenceId]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('retained provenance prevents legacy hard removal without changing unused-source behavior', async () => {
    const c = await sourceContext(f, owner);
    expect(
      (await f.app.inject({ method: 'DELETE', url: c.source, headers: owner.headers })).statusCode,
    ).toBe(409);
    expect(
      (await f.app.inject({ url: c.source + '/references', headers: owner.headers })).json().data,
    ).toHaveLength(1);
  });
  it('does not rewrite historical origin when source availability changes', async () => {
    const c = await sourceContext(f, owner);
    await f.pool.query("update project_sources set status='FAILED' where id=$1", [c.sourceId]);
    const list = await f.app.inject({ url: c.source + '/references', headers: owner.headers });
    expect(list.json().data[0]).toMatchObject({
      id: c.referenceId,
      revision: 'revision-1',
      locator: { kind: 'DOCUMENT', page: 1 },
    });
  });
  it('runs explicit pending/start/succeed lifecycle with exact input/output provenance and replay', async () => {
    const c = await sourceContext(f, owner);
    const body = { operationId: op(), revision: 'revision-1', inputReferenceIds: [c.referenceId] };
    const created = await post(c.source + '/runs', body),
      run = created.json().data.id;
    expect(created.json().data.state).toBe('PENDING');
    expect((await post(c.source + '/runs', body)).json().data.replayed).toBe(true);
    const command = c.source + '/runs/' + run + '/commands';
    expect(
      (await post(command, { operationId: op(), expectedStamp: 0, action: 'START' })).json().data,
    ).toMatchObject({ state: 'RUNNING', changeStamp: 1 });
    const success = {
      operationId: op(),
      expectedStamp: 1,
      action: 'SUCCEED',
      outputReferenceIds: [c.referenceId],
    };
    expect((await post(command, success)).json().data).toMatchObject({
      state: 'SUCCEEDED',
      changeStamp: 2,
    });
    expect((await post(command, success)).json().data.replayed).toBe(true);
    expect(
      (await post(command, { operationId: op(), expectedStamp: 2, action: 'START' })).statusCode,
    ).toBe(409);
    const list = await f.app.inject({ url: c.source + '/runs', headers: owner.headers });
    expect(list.json().data[0].references).toHaveLength(2);
    await expect(
      f.pool.query("update ingestion_runs set state='RUNNING',completed_at=null where id=$1", [
        run,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      f.pool.query('delete from ingestion_run_references where run_id=$1', [run]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('failed attempt retry creates a distinct attempt with preserved original failure', async () => {
    const c = await sourceContext(f, owner);
    const first = (
      await post(c.source + '/runs', { operationId: op(), revision: 'revision-1' })
    ).json().data.id;
    const url = c.source + '/runs/' + first + '/commands';
    await post(url, { operationId: op(), expectedStamp: 0, action: 'START' });
    expect(
      (
        await post(url, {
          operationId: op(),
          expectedStamp: 1,
          action: 'FAIL',
          failureCode: 'INPUT_INVALID',
        })
      ).json().data.state,
    ).toBe('FAILED');
    const retry = await post(c.source + '/runs', {
      operationId: op(),
      revision: 'revision-1',
      retryOf: first,
    });
    expect(retry.json().data.id).not.toBe(first);
    const rows = await f.pool.query('select state,failure_code from ingestion_runs where id=$1', [
      first,
    ]);
    expect(rows.rows[0]).toEqual({ state: 'FAILED', failure_code: 'INPUT_INVALID' });
  });
  it('rejects mismatched input provenance atomically and permits only one active attempt', async () => {
    const c = await sourceContext(f, owner),
      other = await sourceContext(f, owner);
    expect(
      (
        await post(c.source + '/runs', {
          operationId: op(),
          revision: 'revision-1',
          inputReferenceIds: [other.referenceId],
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (await f.pool.query('select id from ingestion_runs where source_id=$1', [c.sourceId]))
        .rowCount,
    ).toBe(0);
    expect(
      (await post(c.source + '/runs', { operationId: op(), revision: 'revision-1' })).statusCode,
    ).toBe(200);
    expect(
      (await post(c.source + '/runs', { operationId: op(), revision: 'revision-2' })).statusCode,
    ).toBe(409);
  });
  it('rejects pending success, stale transitions, and supports cancellation', async () => {
    const c = await sourceContext(f, owner),
      run = (await post(c.source + '/runs', { operationId: op(), revision: 'revision-1' })).json()
        .data.id;
    const url = c.source + '/runs/' + run + '/commands';
    expect(
      (await post(url, { operationId: op(), expectedStamp: 0, action: 'SUCCEED' })).statusCode,
    ).toBe(409);
    await post(url, { operationId: op(), expectedStamp: 0, action: 'START' });
    expect(
      (await post(url, { operationId: op(), expectedStamp: 0, action: 'CANCEL' })).statusCode,
    ).toBe(409);
    expect(
      (await post(url, { operationId: op(), expectedStamp: 1, action: 'CANCEL' })).json().data
        .state,
    ).toBe('CANCELLED');
  });
});
