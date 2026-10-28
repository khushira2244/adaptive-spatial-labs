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
import { MeetingAdmission } from '../src/modules/meetings/meeting.admission.js';
import { MeetingPresence } from '../src/modules/meetings/meeting.presence.js';
import { domainWrites } from '../src/app/domain-writes.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
describe('Meeting lifecycle, authority and private scope', () => {
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
    return id;
  };
  const transfer = async (id: string, target: string) => {
    const m = await view(f, id, owner),
      res = await command(f, owner, id, {
        action: 'REQUEST_TRANSFER',
        authorityGeneration: m.shared.authorityGeneration,
        targetParticipantId: target,
      });
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data.id as string;
  };
  it('owner creates many Meetings for one Presentation; rejects outsider and mismatched scope', async () => {
    const a = await createMeetingFor(f, owner, p),
      b = await createMeetingFor(f, owner, p);
    expect(a).not.toBe(b);
    const body = {
      operationId: op(),
      projectId: p.projectId,
      presentationId: p.presentationId,
      title: 'No authority',
      startFromScreenId: p.main,
    };
    expect((await post(f, '/api/v1/meetings', body, outsider)).statusCode).toBe(404);
    expect(
      (await post(f, '/api/v1/meetings', { ...body, operationId: op(), projectId: op() }, owner))
        .statusCode,
    ).toBe(404);
    const list = await f.app.inject({ url: '/api/v1/meetings', headers: outsider.headers });
    expect(list.json().data.count).toBe(0);
  });
  it('schedule does not freeze early; start captures only confirmed definitions exactly once', async () => {
    const id = await createMeetingFor(f, owner, p, {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect((await view(f, id, owner)).snapshot).toBeNull();
    const m = await view(f, id, owner),
      body = { operationId: op(), expectedStamp: m.changeStamp, action: 'START' };
    const one = await post(f, meetingUrl(id) + '/commands', body, owner),
      two = await post(f, meetingUrl(id) + '/commands', body, owner);
    expect(one.statusCode, one.body).toBe(200);
    expect(two.json().data).toEqual({ ...one.json().data, replayed: true });
    const current = await view(f, id, owner);
    expect(current.state).toBe('LIVE');
    expect(current.snapshot.screens.map((s: { id: string }) => s.id).sort()).toEqual(
      [p.main, p.screen].sort(),
    );
    expect(current.shared.presenterParticipantId).toBe(current.selfParticipantId);
    expect(current.snapshot).not.toHaveProperty('graphs');
    expect(
      (
        await f.pool.query('select id from meeting_presentation_snapshots where meeting_id=$1', [
          id,
        ])
      ).rowCount,
    ).toBe(1);
    await expect(
      f.pool.query("update meeting_presentation_snapshots set payload='{}' where meeting_id=$1", [
        id,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('rejects draft Start From and leaves all start writes absent', async () => {
    const id = await createMeetingFor(f, owner, p, { startFromScreenId: p.draftId }),
      m = await view(f, id, owner);
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/commands',
          { operationId: op(), expectedStamp: m.changeStamp, action: 'START' },
          owner,
        )
      ).statusCode,
    ).toBe(409);
    const current = await view(f, id, owner);
    expect(current.state).toBe('DRAFT');
    expect(current.snapshot).toBeNull();
    expect(current.shared).toBeNull();
  });
  it('failed Start is atomic; retry after failure creates one consistent snapshot', async () => {
    const id = await createMeetingFor(f, owner, p),
      operationId = op();
    await f.pool.query(
      "CREATE FUNCTION step5_fail_start() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$; CREATE TRIGGER step5_fail_start BEFORE INSERT ON meeting_shared_state FOR EACH ROW EXECUTE FUNCTION step5_fail_start();",
    );
    try {
      expect(
        (
          await post(
            f,
            meetingUrl(id) + '/commands',
            { operationId, expectedStamp: 0, action: 'START' },
            owner,
          )
        ).statusCode,
      ).toBe(500);
    } finally {
      await f.pool.query(
        'DROP TRIGGER step5_fail_start ON meeting_shared_state; DROP FUNCTION step5_fail_start();',
      );
    }
    expect((await view(f, id, owner)).snapshot).toBeNull();
    expect(
      (await f.pool.query('select id from operation_results where id=$1', [operationId])).rowCount,
    ).toBe(0);
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/commands',
          { operationId, expectedStamp: 0, action: 'START' },
          owner,
        )
      ).statusCode,
    ).toBe(200);
  });
  it('later Builder drafts/new confirmation never change the Meeting start snapshot', async () => {
    const local = await prepared(f, owner),
      id = await createMeetingFor(f, owner, local);
    await start(f, owner, id);
    const original = (await view(f, id, owner)).snapshot;
    expect(
      (
        await post(
          f,
          local.purl + '/screens/' + local.screen + '/commands',
          {
            operationId: op(),
            expectedStamp: 2,
            action: 'EDIT',
            name: 'Later',
            scenarioGoal: 'Changed',
            notes: 'Later notes',
            understanding: { summary: 'Later private preparation', points: [] },
          },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    await post(
      f,
      local.purl + '/screens/' + local.screen + '/commands',
      { operationId: op(), expectedStamp: 3, action: 'ACCEPT_UNDERSTANDING' },
      owner,
    );
    await post(
      f,
      local.purl + '/screens/' + local.screen + '/commands',
      { operationId: op(), expectedStamp: 4, action: 'CONFIRM' },
      owner,
    );
    expect((await view(f, id, owner)).snapshot).toEqual(original);
  });
  it('registered admission/reconnect reuse ActorRef and never grant Project/Presentation access', async () => {
    const id = await live(),
      before = (
        await f.pool.query(
          'select (select count(*) from organization_members) m,(select count(*) from project_editors) e,(select count(*) from presentation_access_grants) g',
        )
      ).rows[0],
      participant = await admit(f, owner, id, editor);
    const body = { operationId: op() };
    expect((await post(f, meetingUrl(id) + '/join', body, editor)).json().data.id).toBe(
      participant,
    );
    expect((await post(f, meetingUrl(id) + '/join', body, editor)).json().data.replayed).toBe(true);
    const results = await Promise.all([
      post(f, meetingUrl(id) + '/join', { operationId: op() }, editor),
      post(f, meetingUrl(id) + '/join', { operationId: op() }, editor),
    ]);
    expect(results.every((r) => r.json().data.id === participant)).toBe(true);
    expect((await f.app.inject({ url: p.purl, headers: editor.headers })).statusCode).toBe(404);
    expect((await f.app.inject({ url: p.url, headers: editor.headers })).statusCode).toBe(404);
    expect(
      (
        await f.pool.query(
          'select (select count(*) from organization_members) m,(select count(*) from project_editors) e,(select count(*) from presentation_access_grants) g',
        )
      ).rows[0],
    ).toEqual(before);
    expect(
      (await f.app.inject({ url: meetingUrl(id), headers: outsider.headers })).statusCode,
    ).toBe(404);
  });
  it('presenter transfer is pending/target-only, decline preserves authority and one pending maximum', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      request = await transfer(id, target),
      m = await view(f, id, owner);
    expect(m.shared.presenterParticipantId).toBe(m.selfParticipantId);
    expect(
      (
        await command(f, owner, id, {
          action: 'REQUEST_TRANSFER',
          authorityGeneration: m.shared.authorityGeneration,
          targetParticipantId: target,
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request })).statusCode,
    ).toBe(404);
    expect(
      (await command(f, owner, id, { action: 'DECLINE_TRANSFER', requestId: request }, editor))
        .statusCode,
    ).toBe(200);
    expect((await view(f, id, owner)).shared.presenterParticipantId).toBe(m.selfParticipantId);
  });
  it('accept transfers only navigation authority; owner Take Back invalidates stale control', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      request = await transfer(id, target);
    expect(
      (await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request }, editor))
        .statusCode,
    ).toBe(200);
    const m = await view(f, id, editor);
    expect(m.shared.presenterParticipantId).toBe(target);
    expect((await command(f, owner, id, { action: 'END' }, editor)).statusCode).toBe(403);
    expect(
      (
        await command(
          f,
          owner,
          id,
          {
            action: 'NAVIGATE',
            screenId: p.screen,
            authorityGeneration: m.shared.authorityGeneration,
          },
          editor,
        )
      ).statusCode,
    ).toBe(200);
    expect((await command(f, owner, id, { action: 'TAKE_BACK' })).statusCode).toBe(200);
    const current = await view(f, id, editor);
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/commands',
          {
            operationId: op(),
            expectedStamp: current.changeStamp,
            action: 'NAVIGATE',
            screenId: p.main,
            authorityGeneration: m.shared.authorityGeneration,
          },
          editor,
        )
      ).statusCode,
    ).toBe(403);
  });
  it('Take Back invalidates an unaccepted pending request', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      request = await transfer(id, target);
    await command(f, owner, id, { action: 'TAKE_BACK' });
    expect(
      (await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request }, editor))
        .statusCode,
    ).toBe(409);
  });
  it('snapshot screen membership and current generation protect shared focus/navigation', async () => {
    const id = await live();
    await admit(f, owner, id, editor);
    expect(
      (
        await command(
          f,
          owner,
          id,
          { action: 'NAVIGATE', screenId: p.main, authorityGeneration: 0 },
          editor,
        )
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await command(f, owner, id, {
          action: 'NAVIGATE',
          screenId: p.draftId,
          authorityGeneration: 0,
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await command(f, owner, id, {
          action: 'NAVIGATE',
          screenId: p.screen,
          authorityGeneration: 99,
        })
      ).statusCode,
    ).toBe(409);
    expect(
      (
        await command(f, owner, id, {
          action: 'FOCUS',
          scope: { ...p.scope, kind: 'NODE', nodeRef: p.family.graphs[0]!.nodes[0]!.id },
          authorityGeneration: 0,
        })
      ).statusCode,
    ).toBe(200);
  });
  it('private checkpoint stays actor-only; Return to Live restores current shared screen', async () => {
    const id = await live();
    await admit(f, owner, id, editor);
    const before = await view(f, id, owner);
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: meetingUrl(id) + '/private/checkpoint',
          headers: editor.headers,
          payload: {
            expectedStamp: 0,
            following: false,
            screenId: p.screen,
            scope: { ...p.scope, kind: 'NODE', nodeRef: p.family.graphs[0]!.nodes[1]!.id },
          },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await f.app.inject({ url: meetingUrl(id) + '/private/checkpoint', headers: owner.headers })
      ).json().data.checkpoint,
    ).toBeNull();
    expect((await view(f, id, owner)).shared).toEqual(before.shared);
    await command(f, owner, id, { action: 'NAVIGATE', screenId: p.screen, authorityGeneration: 0 });
    const back = await post(f, meetingUrl(id) + '/return-to-live', {}, editor);
    expect(back.json().data.shared.screenId).toBe(p.screen);
    expect(back.json().data.checkpoint.following).toBe(true);
    expect(await view(f, id, owner)).not.toHaveProperty('checkpoint');
  });
  it.each(['handPath', 'gaze', 'cameraHistory'])('rejects private raw %s', async (key) => {
    const id = await live();
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: meetingUrl(id) + '/private/checkpoint',
          headers: owner.headers,
          payload: { expectedStamp: 0, following: false, screenId: p.main, [key]: [] },
        })
      ).statusCode,
    ).toBe(400);
  });
  it('trusted disconnect fallback is epoch/generation guarded; owner disconnect never ends', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      presence = new MeetingPresence(f.db),
      principal = await authenticatedPrincipal(f, editor),
      connection = await presence.connect(principal, id),
      request = await transfer(id, target);
    await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request }, editor);
    let m = await view(f, id, owner);
    expect(
      await presence.disconnect(id, target, connection.epoch, m.shared.authorityGeneration - 1),
    ).toBe(false);
    expect((await view(f, id, owner)).shared.presenterParticipantId).toBe(target);
    expect(
      await presence.disconnect(id, target, connection.epoch - 1, m.shared.authorityGeneration),
    ).toBe(false);
    expect(
      await presence.disconnect(id, target, connection.epoch, m.shared.authorityGeneration),
    ).toBe(true);
    const ownerConnection = await presence.connect(await authenticatedPrincipal(f, owner), id);
    m = await view(f, id, owner);
    expect(
      await presence.disconnect(
        id,
        ownerConnection.participantId,
        ownerConnection.epoch,
        m.shared.authorityGeneration,
      ),
    ).toBe(false);
    expect((await view(f, id, owner)).state).toBe('LIVE');
  });
  it('temporary presenter leave falls back to owner and stable participant reconnects', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      request = await transfer(id, target);
    await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request }, editor);
    expect((await command(f, owner, id, { action: 'LEAVE' }, editor)).statusCode).toBe(200);
    const m = await view(f, id, owner);
    expect(m.shared.presenterParticipantId).toBe(m.selfParticipantId);
    expect(
      (await post(f, meetingUrl(id) + '/join', { operationId: op() }, editor)).json().data.id,
    ).toBe(target);
  });
  it('guest admission/private content are actual Meeting-scoped without User/project membership', async () => {
    const id = await live(),
      admission = new MeetingAdmission(f.db, domainWrites(f.db, f.config)),
      before = (
        await f.pool.query(
          'select (select count(*) from users) u,(select count(*) from organization_members) m',
        )
      ).rows[0],
      issued = await admission.guest(
        await authenticatedPrincipal(f, owner),
        id,
        new Date(Date.now() + 3600000),
      ),
      guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    expect((await f.app.inject({ url: meetingUrl(id), headers: guest.headers })).statusCode).toBe(
      200,
    );
    const note = await post(
      f,
      meetingUrl(id) + '/private/items',
      {
        operationId: op(),
        category: 'NOTE',
        title: 'Guest private',
        body: 'Guest private body',
        attachments: [{ kind: 'ARCHITECTURE', scope: p.scope }],
      },
      guest,
    );
    expect(note.statusCode, note.body).toBe(200);
    const item = await f.app.inject({
      url: meetingUrl(id) + '/private/items/' + note.json().data.id,
      headers: guest.headers,
    });
    expect(item.json().data.author).toEqual(issued.actor);
    expect(
      (
        await f.app.inject({
          url: meetingUrl(id) + '/private/items/' + note.json().data.id,
          headers: owner.headers,
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (await f.app.inject({ url: '/api/v1/projects/' + p.projectId, headers: guest.headers }))
        .statusCode,
    ).toBe(401);
    const capture = await post(
      f,
      meetingUrl(id) + '/private/snapshots',
      { operationId: op(), scope: p.scope, payload: { format: 1, title: 'Guest snapshot' } },
      guest,
    );
    expect(capture.statusCode, capture.body).toBe(200);
    expect(
      (
        await f.pool.query(
          'select (select count(*) from users) u,(select count(*) from organization_members) m',
        )
      ).rows[0],
    ).toEqual(before);
    const guestId = issued.actor.kind === 'SCOPED_GUEST' ? issued.actor.guestId : op();
    await f.pool.query('update scoped_guest_access set revoked_at=now() where id=$1', [guestId]);
    expect(
      (await f.app.inject({ url: meetingUrl(id) + '/my-space', headers: guest.headers }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await f.pool.query('select guest_id from knowledge_items where id=$1', [
          note.json().data.id,
        ])
      ).rows[0].guest_id,
    ).toBe(guestId);
  });
  it('End creates exactly one immutable structured capture and returns original result on retry', async () => {
    const id = await live(),
      m = await view(f, id, owner),
      body = { operationId: op(), expectedStamp: m.changeStamp, action: 'END' },
      first = await post(f, meetingUrl(id) + '/commands', body, owner),
      retry = await post(f, meetingUrl(id) + '/commands', body, owner);
    expect(first.statusCode, first.body).toBe(200);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    const final = await view(f, id, owner);
    expect(final.state).toBe('ENDED');
    expect(final.frozenCapture.payload).not.toHaveProperty('private');
    expect(final.frozenCapture.payload).not.toHaveProperty('audio');
    expect(final.frozenCapture.payload).not.toHaveProperty('transcript');
    expect(
      (await f.pool.query('select id from frozen_meeting_captures where meeting_id=$1', [id]))
        .rowCount,
    ).toBe(1);
    await expect(
      f.pool.query("update frozen_meeting_captures set payload='{}' where meeting_id=$1", [id]),
    ).rejects.toMatchObject({ code: '23514' });
    expect((await command(f, owner, id, { action: 'TAKE_BACK' })).statusCode).toBe(409);
  });
  it('failed End rolls back capture and LIVE lifecycle', async () => {
    const id = await live(),
      before = await view(f, id, owner),
      operationId = op();
    await f.pool.query(
      "CREATE FUNCTION step5_fail_end() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected'; END $$; CREATE TRIGGER step5_fail_end BEFORE INSERT ON frozen_meeting_captures FOR EACH ROW EXECUTE FUNCTION step5_fail_end();",
    );
    try {
      expect(
        (
          await post(
            f,
            meetingUrl(id) + '/commands',
            { operationId, expectedStamp: before.changeStamp, action: 'END' },
            owner,
          )
        ).statusCode,
      ).toBe(500);
    } finally {
      await f.pool.query(
        'DROP TRIGGER step5_fail_end ON frozen_meeting_captures; DROP FUNCTION step5_fail_end();',
      );
    }
    expect((await view(f, id, owner)).state).toBe('LIVE');
    expect((await view(f, id, owner)).frozenCapture).toBeNull();
  });

  it('startup recovery clears stale connections and invalidates prior presenter generation without ending', async () => {
    const id = await live(),
      target = await admit(f, owner, id, editor),
      presence = new MeetingPresence(f.db),
      connection = await presence.connect(await authenticatedPrincipal(f, editor), id),
      request = await transfer(id, target);
    await command(f, owner, id, { action: 'ACCEPT_TRANSFER', requestId: request }, editor);
    const old = await view(f, id, owner);
    await presence.recover();
    const current = await view(f, id, owner);
    expect(current.state).toBe('LIVE');
    expect(current.shared.presenterParticipantId).toBe(current.selfParticipantId);
    expect(current.shared.authorityGeneration).toBe(old.shared.authorityGeneration + 1);
    expect(current.participants.every((p: { connected: boolean }) => p.connected === false)).toBe(
      true,
    );
    expect(
      await presence.disconnect(id, target, connection.epoch, old.shared.authorityGeneration),
    ).toBe(false);
  });
});
