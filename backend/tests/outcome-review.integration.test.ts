import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { prepared, createMeetingFor, start, meetingUrl, command } from './meeting.fixture.js';
import { ended, readReview, cmd, ok, post, op, reviewUrl } from './outcome.fixture.js';
describe('Frozen deterministic Meeting review and human assessment', () => {
  let f: Fixture,
    owner: Actor,
    editor: Actor,
    outsider: Actor,
    p: Awaited<ReturnType<typeof prepared>>;
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    p = await prepared(f, owner);
  });
  afterAll(async () => {
    await f?.close();
  });
  const make = () => ended(f, owner, editor, p);
  it('requires ended Meeting, not scheduled/draft or live', async () => {
    const id = await createMeetingFor(f, owner, p),
      body = { operationId: op(), captureId: op() };
    expect((await post(f, meetingUrl(id) + '/review', body, owner)).statusCode).toBe(409);
    await start(f, owner, id);
    expect(
      (await post(f, meetingUrl(id) + '/review', { ...body, operationId: op() }, owner)).statusCode,
    ).toBe(409);
  });
  it('requires exact End capture, including same-Project cross-Meeting', async () => {
    const a = await make(),
      b = await ended(f, owner, editor, p, false);
    expect(
      (
        await post(
          f,
          meetingUrl(b.id) + '/review',
          { operationId: op(), captureId: a.captureId },
          owner,
        )
      ).statusCode,
    ).toBe(404);
  });
  it('creation denies outsiders and participants without owner authority', async () => {
    const a = await ended(f, owner, editor, p, false);
    for (const actor of [outsider, editor])
      expect(
        (
          await post(
            f,
            meetingUrl(a.id) + '/review',
            { operationId: op(), captureId: a.captureId },
            actor,
          )
        ).statusCode,
      ).toBe(404);
  });
  it('same creation intent replays identity and new intent reuses one review', async () => {
    const a = await make();
    const retry = await post(f, meetingUrl(a.id) + '/review', a.body, owner);
    expect(retry.json().data).toMatchObject({ id: a.reviewId, replayed: true });
    const other = await post(
      f,
      meetingUrl(a.id) + '/review',
      { ...a.body, operationId: op() },
      owner,
    );
    expect(other.json().data.id).toBe(a.reviewId);
    expect(
      (await f.pool.query('select id from meeting_reviews where meeting_id=$1', [a.id])).rowCount,
    ).toBe(1);
  });
  it('concurrent review creation yields one stable identity', async () => {
    const a = await ended(f, owner, editor, p, false);
    const results = await Promise.all(
      [op(), op()].map((operationId) =>
        post(f, meetingUrl(a.id) + '/review', { operationId, captureId: a.captureId }, owner),
      ),
    );
    expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
    expect(results[0]!.json().data.id).toBe(results[1]!.json().data.id);
  });
  it('projection uses only pinned revisions, safe attribution and confirmed definitions', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner);
    expect(r.source.entries).toHaveLength(3);
    expect(r.source.screens.map((s: { id: string }) => s.id)).toContain(p.screen);
    expect(r.source.screens.map((s: { id: string }) => s.id)).not.toContain(p.draftId);
    expect(r.source.participants.some((x: { id: string }) => x.id === a.participantId)).toBe(true);
    const raw = JSON.stringify(r);
    for (const secret of [
      a.origin,
      a.hidden,
      a.withdrawn,
      'Unshared secret',
      'Withdrawn secret',
      'originId',
      'checkpoint',
      'tokenHash',
      'transcript',
      'audio',
    ])
      expect(raw).not.toContain(secret);
  });
  it('private origin edits after End cannot change review source or draft seeds', async () => {
    const a = await make(),
      before = await readReview(f, a.reviewId, owner);
    const changed = await f.app.inject({
      method: 'PUT',
      url: meetingUrl(a.id) + '/private/items/' + a.origin,
      headers: editor.headers,
      payload: {
        expectedStamp: 0,
        category: 'NOTE',
        title: 'Later private edit',
        body: 'Later secret',
      },
    });
    expect(changed.statusCode, changed.body).toBe(200);
    const after = await readReview(f, a.reviewId, owner);
    expect(after.source).toEqual(before.source);
    expect(JSON.stringify(after)).not.toContain('Later secret');
  });
  it('End rejects later publication updates; review never follows mutable latest pointers', async () => {
    const a = await make();
    expect(
      (
        await command(f, owner, a.id, {
          action: 'NAVIGATE',
          screenId: p.screen,
          authorityGeneration: 0,
        })
      ).statusCode,
    ).toBe(409);
    const r = await readReview(f, a.reviewId, owner);
    const sql = await f.pool.query('select payload from frozen_meeting_captures where id=$1', [
      a.captureId,
    ]);
    expect(r.source.entries.map((e: { key: string }) => e.key)).toEqual(
      sql.rows[0].payload.publications.map(
        (x: { revisionId: string }) => 'publication:' + x.revisionId,
      ),
    );
  });
  it('owner cannot dereference shared or unshared private originals', async () => {
    const a = await make();
    for (const id of [a.origin, a.hidden])
      expect(
        (
          await f.app.inject({
            url: meetingUrl(a.id) + '/private/items/' + id,
            headers: owner.headers,
          })
        ).statusCode,
      ).toBe(404);
  });
  it('draft read/edit is owner-only, no presenter/participant authority', async () => {
    const a = await make();
    expect(
      (await f.app.inject({ url: reviewUrl(a.reviewId), headers: editor.headers })).statusCode,
    ).toBe(404);
    expect(
      (
        await post(
          f,
          reviewUrl(a.reviewId) + '/commands',
          { operationId: op(), expectedStamp: 0, action: 'READY', confirmed: true },
          editor,
        )
      ).statusCode,
    ).toBe(404);
  });
  it('manual summaries and entries are bounded autosaved draft work', async () => {
    const a = await make();
    await ok(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'Human authored summary' });
    await ok(f, a.reviewId, owner, {
      action: 'ADD_MANUAL',
      title: 'Manual observation',
      summary: 'Not inferred speech',
      evidenceKeys: [],
    });
    const r = await readReview(f, a.reviewId, owner);
    expect(r.state).toBe('REVIEWING');
    expect(r.summary).toBe('Human authored summary');
    expect(r.items).toHaveLength(4);
    expect(r.items.find((i: { category: string }) => i.category === 'MANUAL').classification).toBe(
      'RAISED',
    );
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'x'.repeat(4001) }))
        .statusCode,
    ).toBe(400);
  });
  it('Raised to Discussed is explicit and same command intent replays original stamp', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner),
      body = {
        operationId: op(),
        expectedStamp: 0,
        action: 'CLASSIFY',
        itemId: r.items[0].id,
        classification: 'DISCUSSED',
      };
    const first = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner),
      retry = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner);
    expect(first.statusCode, first.body).toBe(200);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
  });
  for (const classification of [
    'ADDRESSED',
    'UNRESOLVED',
    'DEFERRED',
    'DECISION',
    'ACTION',
    'NOT_DISCUSSED',
  ]) {
    it('human Discussed to ' + classification, async () => {
      const a = await make(),
        r = await readReview(f, a.reviewId, owner),
        itemId = r.items[0].id;
      await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'DISCUSSED' });
      await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification });
      expect((await readReview(f, a.reviewId, owner)).items[0].classification).toBe(classification);
    });
  }
  it('rejects automatic Raised-to-Decision and invalid terminal jumps', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner),
      itemId = r.items[0].id;
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'DECISION' }))
        .statusCode,
    ).toBe(409);
    await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'DISCUSSED' });
    await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'UNRESOLVED' });
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'ADDRESSED' }))
        .statusCode,
    ).toBe(409);
    await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'DISCUSSED' });
  });
  it('stale edits conflict without silently replacing human work', async () => {
    const a = await make();
    await ok(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'First edit' });
    const res = await post(
      f,
      reviewUrl(a.reviewId) + '/commands',
      { operationId: op(), expectedStamp: 0, action: 'SUMMARY', summary: 'Stale' },
      owner,
    );
    expect(res.statusCode).toBe(409);
    expect((await readReview(f, a.reviewId, owner)).summary).toBe('First edit');
  });
  it('evidence only accepts exact frozen safe references, not private or unrelated IDs', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner),
      itemId = r.items[0].id;
    await ok(f, a.reviewId, owner, {
      action: 'EVIDENCE',
      itemId,
      evidenceKeys: [r.source.evidenceKeys[0]],
    });
    for (const evidenceKeys of [
      [a.origin],
      ['publication:' + op()],
      [r.source.evidenceKeys[0], r.source.evidenceKeys[0]],
    ])
      expect(
        (await cmd(f, a.reviewId, owner, { action: 'EVIDENCE', itemId, evidenceKeys })).statusCode,
      ).toBe(400);
  });
  it('can deliberately ignore and reorder, cannot lose or duplicate items', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner),
      itemId = r.items[0].id;
    await ok(f, a.reviewId, owner, { action: 'RETAIN', itemId, retained: false });
    const itemIds = r.items.map((i: { id: string }) => i.id).reverse();
    await ok(f, a.reviewId, owner, { action: 'REORDER', itemIds });
    expect((await readReview(f, a.reviewId, owner)).items[2].retained).toBe(false);
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'REORDER', itemIds: itemIds.slice(1) }))
        .statusCode,
    ).toBe(400);
  });
  it('bounded pagination and malformed/overposted commands fail closed', async () => {
    const a = await make();
    const get = await f.app.inject({
      url: reviewUrl(a.reviewId) + '?limit=1&offset=1',
      headers: owner.headers,
    });
    expect(get.json().data.items).toHaveLength(1);
    expect(get.json().data.count).toBe(3);
    expect(
      (await f.app.inject({ url: reviewUrl(a.reviewId) + '?limit=101', headers: owner.headers }))
        .statusCode,
    ).toBe(400);
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'ok', ownerId: outsider.id }))
        .statusCode,
    ).toBe(400);
  });
  it('prepared inclusions are exact start definitions, never current Builder edits', async () => {
    const local = await prepared(f, owner),
      note = await post(
        f,
        '/api/v1/knowledge',
        {
          operationId: op(),
          category: 'QUESTION',
          title: 'Prepared question',
          body: 'Prepared body',
        },
        owner,
      );
    expect(note.statusCode, note.body).toBe(200);
    let builder = (await f.app.inject({ url: local.purl, headers: owner.headers })).json().data;
    let screen = builder.screens.find((s: { id: string }) => s.id === local.screen);
    const route = local.purl + '/screens/' + local.screen + '/commands';
    expect(
      (
        await post(
          f,
          route,
          {
            operationId: op(),
            expectedStamp: screen.changeStamp,
            action: 'INCLUDE_KNOWLEDGE',
            includeBody: true,
            itemId: note.json().data.id,
            expectedItemStamp: 0,
          },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    builder = (await f.app.inject({ url: local.purl, headers: owner.headers })).json().data;
    screen = builder.screens.find((s: { id: string }) => s.id === local.screen);
    expect(
      (
        await post(
          f,
          route,
          { operationId: op(), expectedStamp: screen.changeStamp, action: 'CONFIRM' },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    const a = await ended(f, owner, editor, local),
      before = await readReview(f, a.reviewId, owner);
    expect(
      before.source.entries.some(
        (e: { representation: { title: string } }) =>
          e.representation.title === 'Prepared question',
      ),
    ).toBe(true);
    builder = (await f.app.inject({ url: local.purl, headers: owner.headers })).json().data;
    screen = builder.screens.find((s: { id: string }) => s.id === local.screen);
    expect(
      (
        await post(
          f,
          route,
          {
            operationId: op(),
            expectedStamp: screen.changeStamp,
            action: 'EDIT',
            name: 'Later draft',
            scenarioGoal: 'Later',
            notes: 'Later secret',
            understanding: { summary: 'Later', points: [] },
          },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    expect((await readReview(f, a.reviewId, owner)).source).toEqual(before.source);
  });
});
