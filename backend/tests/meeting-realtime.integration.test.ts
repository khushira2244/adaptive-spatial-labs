import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
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
import { Inbox } from './meeting.ws-fixture.js';
import type { MeetingQuery } from '../src/modules/meetings/meeting.query.js';
import { MeetingAdmission } from '../src/modules/meetings/meeting.admission.js';
import { domainWrites } from '../src/app/domain-writes.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
type State = Awaited<ReturnType<MeetingQuery['read']>>;
describe('Authenticated Meeting WebSocket transport', () => {
  let f: Fixture,
    owner: Actor,
    editor: Actor,
    outsider: Actor,
    p: Awaited<ReturnType<typeof prepared>>,
    inboxes: Inbox[] = [];
  beforeAll(async () => {
    f = await fixture();
    ({ owner, editor, outsider } = await actors(f));
    p = await prepared(f, owner);
  });
  afterEach(async () => {
    for (const box of inboxes) box.dispose();
    inboxes = [];
    await new Promise((resolve) => setTimeout(resolve, 80));
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
  const connect = async (id: string, actor = owner) => {
    let inbox: Inbox | undefined;
    await f.app.injectWS(
      meetingUrl(id) + '/ws',
      { headers: actor.headers },
      {
        onInit: (socket) => {
          inbox = new Inbox(socket);
          inboxes.push(inbox);
        },
      },
    );
    if (!inbox) throw new Error('No socket initialized.');
    const first = await inbox.next(
      (frame) => frame.type === 'STATE' && frame.event === 'connected',
    );
    return { inbox, state: first.data as State };
  };
  it('requires authentication/admission and refuses non-LIVE connection', async () => {
    const id = await live();
    await expect(f.app.injectWS(meetingUrl(id) + '/ws')).rejects.toThrow();
    await expect(
      f.app.injectWS(meetingUrl(id) + '/ws', { headers: outsider.headers }),
    ).rejects.toThrow();
    const draft = await createMeetingFor(f, owner, p);
    await expect(
      f.app.injectWS(meetingUrl(draft) + '/ws', { headers: owner.headers }),
    ).rejects.toThrow();
  });
  it('admitted connection receives authorized current state and never private checkpoints/origins', async () => {
    const id = await live(),
      note = await post(
        f,
        meetingUrl(id) + '/private/items',
        {
          operationId: op(),
          category: 'NOTE',
          title: 'Socket-private title',
          body: 'Socket-private body',
        },
        editor,
      );
    await f.app.inject({
      method: 'PUT',
      url: meetingUrl(id) + '/private/checkpoint',
      headers: editor.headers,
      payload: { expectedStamp: 0, following: false, screenId: p.screen },
    });
    const { state } = await connect(id, owner);
    expect(state.state).toBe('LIVE');
    expect(state.shared?.screenId).toBe(p.main);
    expect(JSON.stringify(state)).not.toContain('Socket-private title');
    expect(JSON.stringify(state)).not.toContain(note.json().data.id);
    expect(state).not.toHaveProperty('checkpoint');
  });
  it('presenter navigation broadcasts authoritative state; participant cannot forge authority', async () => {
    const id = await live(),
      a = await connect(id, owner),
      b = await connect(id, editor),
      m = await view(f, id, owner);
    b.inbox.send({
      type: 'COMMAND',
      command: {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'NAVIGATE',
        authorityGeneration: m.shared.authorityGeneration,
        screenId: p.screen,
      },
    });
    expect((await b.inbox.next((frame) => frame.type === 'ERROR')).code).toBe('DOMAIN_FORBIDDEN');
    a.inbox.send({
      type: 'COMMAND',
      command: {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'NAVIGATE',
        authorityGeneration: m.shared.authorityGeneration,
        screenId: p.screen,
      },
    });
    const event = await b.inbox.next(
      (frame) => frame.type === 'STATE' && frame.event === 'shared.screen.changed',
    );
    expect((event.data as State).shared?.screenId).toBe(p.screen);
    expect((await a.inbox.next((frame) => frame.type === 'ACK')).type).toBe('ACK');
  });
  it('reconnect reuses participant and resyncs current shared state', async () => {
    const id = await live(),
      before = await connect(id, editor),
      participant = before.state.selfParticipantId;
    before.inbox.dispose();
    await command(f, owner, id, { action: 'NAVIGATE', authorityGeneration: 0, screenId: p.screen });
    const after = await connect(id, editor);
    expect(after.state.selfParticipantId).toBe(participant);
    expect(after.state.shared?.screenId).toBe(p.screen);
    expect(
      (
        await f.pool.query(
          'select id from meeting_participants where meeting_id=$1 and user_id=$2',
          [id, editor.id],
        )
      ).rowCount,
    ).toBe(1);
    after.inbox.send({ type: 'SYNC' });
    expect(
      (
        (await after.inbox.next((frame) => frame.type === 'STATE' && frame.event === 'resync'))
          .data as State
      ).shared?.screenId,
    ).toBe(p.screen);
  });
  it('private creation/edit is not broadcast; explicit Share broadcasts only intended publication', async () => {
    const id = await live(),
      a = await connect(id, owner),
      b = await connect(id, editor);
    const hidden = await post(
      f,
      meetingUrl(id) + '/private/items',
      {
        operationId: op(),
        category: 'NOTE',
        title: 'Unshared websocket secret',
        body: 'Never broadcast',
      },
      editor,
    );
    const item = await post(
      f,
      meetingUrl(id) + '/private/items',
      {
        operationId: op(),
        category: 'QUESTION',
        title: 'Explicit shared question',
        body: 'How does retry work?',
      },
      editor,
    );
    const m = await view(f, id, editor);
    b.inbox.send({
      type: 'PUBLICATION',
      command: {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'QUESTION',
        origin: { kind: 'KNOWLEDGE', id: item.json().data.id, expectedItemStamp: 0 },
        scope: p.scope,
      },
    });
    const frame = await a.inbox.next(
        (frame) => frame.type === 'STATE' && frame.event === 'publication.created',
      ),
      state = frame.data as State;
    expect(state.context.publications[0]!.body.content.body).toBe('How does retry work?');
    expect(JSON.stringify(frame)).not.toContain('Unshared websocket secret');
    expect(JSON.stringify(frame)).not.toContain(hidden.json().data.id);
    expect(JSON.stringify(frame)).not.toContain(item.json().data.id);
  });
  it('every mutation rechecks credential/admission; revoked participant stops receiving state', async () => {
    const id = await live(),
      a = await connect(id, owner),
      b = await connect(id, editor),
      m = await view(f, id, owner);
    const closed = new Promise<void>((resolve) => b.inbox.socket.once('close', () => resolve()));
    expect(
      (
        await post(
          f,
          meetingUrl(id) + '/commands',
          {
            operationId: op(),
            expectedStamp: m.changeStamp,
            action: 'REVOKE',
            participantId: b.state.selfParticipantId,
          },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    await closed;
    expect((await f.app.inject({ url: meetingUrl(id), headers: editor.headers })).statusCode).toBe(
      404,
    );
    a.inbox.send({ type: 'SYNC' });
    expect(
      (await a.inbox.next((frame) => frame.type === 'STATE' && frame.event === 'resync')).type,
    ).toBe('STATE');
  });
  it('guest token is isolated to one Meeting and revocation blocks a command immediately', async () => {
    const id = await live(),
      other = await live(),
      issued = await new MeetingAdmission(f.db, domainWrites(f.db, f.config)).guest(
        await authenticatedPrincipal(f, owner),
        id,
        new Date(Date.now() + 3600000),
      ),
      guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    await expect(
      f.app.injectWS(meetingUrl(other) + '/ws', { headers: guest.headers }),
    ).rejects.toThrow();
    const g = await connect(id, guest),
      guestId = issued.actor.kind === 'SCOPED_GUEST' ? issued.actor.guestId : op();
    await f.pool.query('update scoped_guest_access set revoked_at=now() where id=$1', [guestId]);
    g.inbox.send({ type: 'SYNC' });
    expect((await g.inbox.next((frame) => frame.type === 'ERROR')).code).toBe(
      'DOMAIN_UNAUTHORIZED',
    );
  });
  it('temporary presenter socket disconnect triggers owner fallback; owner remains authority when offline', async () => {
    const id = await live(),
      a = await connect(id, owner),
      b = await connect(id, editor),
      m = await view(f, id, owner),
      target = b.state.selfParticipantId;
    const request = await post(
      f,
      meetingUrl(id) + '/commands',
      {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'REQUEST_TRANSFER',
        authorityGeneration: m.shared.authorityGeneration,
        targetParticipantId: target,
      },
      owner,
    );
    expect(
      (
        await command(
          f,
          owner,
          id,
          { action: 'ACCEPT_TRANSFER', requestId: request.json().data.id },
          editor,
        )
      ).statusCode,
    ).toBe(200);
    await a.inbox.next(
      (frame) => frame.type === 'STATE' && frame.event === 'presenter.transfer.accepted',
    );
    b.inbox.dispose();
    const fallback = await a.inbox.next(
      (frame) => frame.type === 'STATE' && frame.event === 'presenter.fallback',
    );
    expect((fallback.data as State).shared?.presenterParticipantId).toBe(a.state.selfParticipantId);
  });
  it('End emits final structured state and closes sockets; later live upgrades are refused', async () => {
    const id = await live(),
      a = await connect(id, owner),
      b = await connect(id, editor);
    const closed = new Promise<void>((resolve) => b.inbox.socket.once('close', () => resolve()));
    expect((await command(f, owner, id, { action: 'END' })).statusCode).toBe(200);
    const ended = await b.inbox.next(
      (frame) => frame.type === 'STATE' && frame.event === 'meeting.ended',
    );
    expect((ended.data as State).state).toBe('ENDED');
    expect((ended.data as State).frozenCapture).not.toBeNull();
    await closed;
    await expect(
      f.app.injectWS(meetingUrl(id) + '/ws', { headers: owner.headers }),
    ).rejects.toThrow();
  });
  it('unsupported tracking/voice/role fields are rejected as commands', async () => {
    const id = await live(),
      a = await connect(id, owner);
    a.inbox.send({ type: 'HAND_POSE', positions: [] });
    expect((await a.inbox.next((frame) => frame.type === 'ERROR')).code).toBe('VALIDATION_ERROR');
    const m = await view(f, id, owner);
    a.inbox.send({
      type: 'COMMAND',
      command: {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'NAVIGATE',
        authorityGeneration: 0,
        screenId: p.screen,
        role: 'OWNER',
        cameraPose: {},
      },
    });
    expect((await a.inbox.next((frame) => frame.type === 'ERROR')).code).toBe('VALIDATION_ERROR');
  });
});
