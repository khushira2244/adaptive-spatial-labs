import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import {
  prepared,
  createMeetingFor,
  start,
  admit,
  view,
  post,
  command,
  meetingUrl,
} from './meeting.fixture.js';
import { op } from './step2.fixture.js';
describe('Explicit Meeting publication revisions and End ordering', () => {
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
  const live = async () => {
    const id = await createMeetingFor(f, owner, p);
    await start(f, owner, id);
    await admit(f, owner, id, editor);
    return id;
  };
  const note = async (id: string, actor = editor, title = 'Intended shared title') => {
    const res = await post(
      f,
      meetingUrl(id) + '/private/items',
      { operationId: op(), category: 'NOTE', title, body: 'Initial intended body' },
      actor,
    );
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data.id as string;
  };
  const share = async (
    id: string,
    itemId: string,
    extra: Record<string, unknown> = {},
    actor = editor,
  ) => {
    const m = await view(f, id, actor);
    return post(
      f,
      meetingUrl(id) + '/publications',
      {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'QUESTION',
        origin: { kind: 'KNOWLEDGE', id: itemId, expectedItemStamp: 0 },
        scope: p.scope,
        ...extra,
      },
      actor,
    );
  };
  it('author shares bounded representation; origin/read/history/private attachments do not leak', async () => {
    const id = await live(),
      item = await note(id),
      hidden = await note(id, editor, 'Unshared title must stay private');
    const shared = await share(id, item);
    expect(shared.statusCode, shared.body).toBe(200);
    const meeting = await view(f, id, owner),
      publication = meeting.context.publications[0];
    expect(publication.body.content).toEqual({
      title: 'Intended shared title',
      body: 'Initial intended body',
    });
    expect(JSON.stringify(meeting)).not.toContain('Unshared title must stay private');
    expect(JSON.stringify(publication)).not.toContain(item);
    expect(publication).not.toHaveProperty('originId');
    expect(publication.body.content).not.toHaveProperty('attachments');
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/private/items/' + item,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/private/items/' + hidden,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(404);
  });
  it('cannot publish another actor private item or wrong Meeting private context', async () => {
    const id = await live(),
      item = await note(id, owner);
    expect((await share(id, item)).statusCode).toBe(404);
    const other = await live(),
      ownOther = await note(other);
    expect((await share(id, ownOther)).statusCode).toBe(400);
  });
  it('same Share intent replays one identity; second explicit share has new identity', async () => {
    const id = await live(),
      item = await note(id),
      m = await view(f, id, editor),
      body = {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'NOTE',
        origin: { kind: 'KNOWLEDGE', id: item, expectedItemStamp: 0 },
        scope: p.scope,
      };
    const a = await post(f, meetingUrl(id) + '/publications', body, editor),
      b = await post(f, meetingUrl(id) + '/publications', body, editor);
    expect(b.json().data).toEqual({ ...a.json().data, replayed: true });
    const separate = await share(id, item);
    expect(separate.json().data.id).not.toBe(a.json().data.id);
    expect(
      (
        await f.pool.query('select id from shared_meeting_item_revisions where publication_id=$1', [
          a.json().data.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it('private edit alone cannot change publication; explicit Update appends immutable revision', async () => {
    const id = await live(),
      item = await note(id);
    await share(id, item);
    const before = (await view(f, id, owner)).context.publications[0];
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: meetingUrl(id) + '/private/items/' + item,
          headers: editor.headers,
          payload: {
            expectedStamp: 0,
            category: 'NOTE',
            title: 'Updated intended',
            body: 'Updated private content',
          },
        })
      ).statusCode,
    ).toBe(200);
    expect((await view(f, id, owner)).context.publications[0]).toEqual(before);
    const m = await view(f, id, editor),
      body = {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'UPDATE',
        publicationId: before.id,
        expectedPublicationStamp: 0,
        origin: { kind: 'KNOWLEDGE', id: item, expectedItemStamp: 1 },
        scope: p.scope,
      };
    const updated = await post(f, meetingUrl(id) + '/publications', body, editor);
    expect(updated.statusCode, updated.body).toBe(200);
    expect(
      (await post(f, meetingUrl(id) + '/publications', body, editor)).json().data.replayed,
    ).toBe(true);
    const current = (await view(f, id, owner)).context.publications[0];
    expect(current.sequence).toBe(2);
    expect(current.revisionId).not.toBe(before.revisionId);
    expect(current.body.content.body).toBe('Updated private content');
    const original = await f.app.inject({
      url: meetingUrl(id) + '/revisions/' + before.revisionId,
      headers: editor.headers,
    });
    expect(original.json().data.body).toEqual(before.body);
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/revisions/' + before.revisionId,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(404);
    await expect(
      f.pool.query("update shared_meeting_item_revisions set body='{}' where id=$1", [
        before.revisionId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('Withdraw is author-only and changes visibility without erasing revision history', async () => {
    const id = await live(),
      item = await note(id);
    await share(id, item);
    const publication = (await view(f, id, owner)).context.publications[0],
      m = await view(f, id, owner);
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/publications',
          {
            operationId: op(),
            expectedStamp: m.changeStamp,
            action: 'WITHDRAW',
            publicationId: publication.id,
            expectedPublicationStamp: 0,
          },
          owner,
        )
      ).statusCode,
    ).toBe(404);
    const body = {
      operationId: op(),
      expectedStamp: m.changeStamp,
      action: 'WITHDRAW',
      publicationId: publication.id,
      expectedPublicationStamp: 0,
    };
    expect((await post(f, meetingUrl(id) + '/publications', body, editor)).statusCode).toBe(200);
    expect((await view(f, id, owner)).context.publications).toEqual([]);
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/revisions/' + publication.revisionId,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/revisions/' + publication.revisionId,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await f.pool.query('select id from shared_meeting_item_revisions where id=$1', [
          publication.revisionId,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it('End pins exact visible revisions and excludes withdrawn and unshared private data/checkpoints', async () => {
    const id = await live(),
      one = await note(id, editor, 'Visible intended'),
      two = await note(id, editor, 'Withdrawn intended'),
      hidden = await note(id, editor, 'Hidden private title');
    await share(id, one);
    await share(id, two);
    const state = await view(f, id, editor),
      withdraw = state.context.publications.find(
        (x: { body: { content: { title: string } } }) =>
          x.body.content.title === 'Withdrawn intended',
      );
    await post(
      f,
      meetingUrl(id) + '/publications',
      {
        operationId: op(),
        expectedStamp: state.changeStamp,
        action: 'WITHDRAW',
        publicationId: withdraw.id,
        expectedPublicationStamp: 0,
      },
      editor,
    );
    await f.app.inject({
      method: 'PUT',
      url: meetingUrl(id) + '/private/checkpoint',
      headers: editor.headers,
      payload: { expectedStamp: 0, following: false, screenId: p.screen },
    });
    const before = await view(f, id, owner);
    expect((await command(f, owner, id, { action: 'END' })).statusCode).toBe(200);
    const end = await view(f, id, owner);
    expect(end.frozenCapture.payload.publications).toEqual(
      before.context.publications.map((x: { id: string; revisionId: string }) => ({
        publicationId: x.id,
        revisionId: x.revisionId,
      })),
    );
    expect(JSON.stringify(end.frozenCapture)).not.toContain(hidden);
    expect(JSON.stringify(end.frozenCapture)).not.toContain('Hidden private title');
    expect(end.frozenCapture.payload).not.toHaveProperty('checkpoint');
    expect(end.frozenCapture.payload).not.toHaveProperty('transcript');
    const pinned = before.context.publications[0];
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/revisions/' + pinned.revisionId,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(200);
    expect((await share(id, one)).statusCode).toBe(409);
  });
  it('Snapshot sharing is creator-only and preserves exact semantic scope without canonical copies', async () => {
    const id = await live(),
      capture = await post(
        f,
        meetingUrl(id) + '/private/snapshots',
        { operationId: op(), scope: p.scope, payload: { format: 1, title: 'Intended capture' } },
        editor,
      );
    expect(capture.statusCode, capture.body).toBe(200);
    const m = await view(f, id, editor),
      body = {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'SNAPSHOT',
        origin: { kind: 'SNAPSHOT', id: capture.json().data.id },
        scope: p.scope,
      };
    expect((await post(f, meetingUrl(id) + '/publications', body, owner)).statusCode).toBe(404);
    const res = await post(
      f,
      meetingUrl(id) + '/publications',
      { ...body, operationId: op() },
      editor,
    );
    expect(res.statusCode, res.body).toBe(200);
    const shared = (await view(f, id, owner)).context.publications[0];
    expect(shared.body.content.scope).toEqual(p.scope);
    expect(shared.body.content).not.toHaveProperty('graphs');
  });
  it.each(['AI_FINDING', 'rawAudio', 'privateHistory'] as const)(
    'rejects unsupported publication input %s',
    async (variant) => {
      const id = await live(),
        item = await note(id),
        extra = variant === 'AI_FINDING' ? { category: 'AI_FINDING' } : { [variant]: [] };
      expect((await share(id, item, extra)).statusCode).toBe(400);
    },
  );
  it('stale original or publication stamp conflicts without publishing a different body', async () => {
    const id = await live(),
      item = await note(id);
    await share(id, item);
    const m = await view(f, id, editor),
      publication = m.context.publications[0];
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/publications',
          {
            operationId: op(),
            expectedStamp: m.changeStamp,
            action: 'UPDATE',
            publicationId: publication.id,
            expectedPublicationStamp: 99,
            origin: { kind: 'KNOWLEDGE', id: item, expectedItemStamp: 0 },
            scope: p.scope,
          },
          editor,
        )
      ).statusCode,
    ).toBe(409);
    expect(
      (await share(id, item, { origin: { kind: 'KNOWLEDGE', id: item, expectedItemStamp: 9 } }))
        .statusCode,
    ).toBe(409);
    expect((await view(f, id, owner)).context.publications[0]).toEqual(publication);
  });
  it('concurrent Update vs End commits one ordering; retrying End captures the winning exact revision', async () => {
    const id = await live(),
      item = await note(id);
    await share(id, item);
    await f.app.inject({
      method: 'PUT',
      url: meetingUrl(id) + '/private/items/' + item,
      headers: editor.headers,
      payload: { expectedStamp: 0, category: 'NOTE', title: 'Updated', body: 'Updated before End' },
    });
    const state = await view(f, id, owner),
      publication = state.context.publications[0],
      responses = await Promise.all([
        post(
          f,
          meetingUrl(id) + '/publications',
          {
            operationId: op(),
            expectedStamp: state.changeStamp,
            action: 'UPDATE',
            publicationId: publication.id,
            expectedPublicationStamp: 0,
            origin: { kind: 'KNOWLEDGE', id: item, expectedItemStamp: 1 },
            scope: p.scope,
          },
          editor,
        ),
        post(
          f,
          meetingUrl(id) + '/commands',
          { operationId: op(), expectedStamp: state.changeStamp, action: 'END' },
          owner,
        ),
      ]);
    expect(responses.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    if (responses[1]!.statusCode === 409)
      expect((await command(f, owner, id, { action: 'END' })).statusCode).toBe(200);
    const final = await view(f, id, owner),
      pinned = final.frozenCapture.payload.publications[0];
    const revision = await f.app.inject({
      url: meetingUrl(id) + '/revisions/' + pinned.revisionId,
      headers: owner.headers,
    });
    expect(revision.json().data.body.content.body).toBe(
      responses[0]!.statusCode === 200 ? 'Updated before End' : 'Initial intended body',
    );
  });
  it('duplicate concurrent Start/End intents never create another freeze record', async () => {
    const id = await createMeetingFor(f, owner, p),
      startBody = { operationId: op(), expectedStamp: 0, action: 'START' };
    const started = await Promise.all([
      post(f, meetingUrl(id) + '/commands', startBody, owner),
      post(f, meetingUrl(id) + '/commands', startBody, owner),
    ]);
    expect(started.every((r) => r.statusCode === 200)).toBe(true);
    expect(started[0]!.json().data.id).toBe(started[1]!.json().data.id);
    const m = await view(f, id, owner),
      body = { operationId: op(), expectedStamp: m.changeStamp, action: 'END' },
      ended = await Promise.all([
        post(f, meetingUrl(id) + '/commands', body, owner),
        post(f, meetingUrl(id) + '/commands', body, owner),
      ]);
    expect(ended.every((r) => r.statusCode === 200)).toBe(true);
    expect(ended[0]!.json().data.id).toBe(ended[1]!.json().data.id);
    expect(
      (await f.pool.query('select id from frozen_meeting_captures where meeting_id=$1', [id]))
        .rowCount,
    ).toBe(1);
  });
});
