import { beforeAll, afterAll, it, describe, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { prepared, createMeetingFor, start, view, post, meetingUrl } from './meeting.fixture.js';
import { op } from './step2.fixture.js';
describe('Final missing freeze-boundary failure injection seams', () => {
  let f: Fixture, owner: Actor, p: Awaited<ReturnType<typeof prepared>>;
  beforeAll(async () => {
    f = await fixture();
    ({ owner } = await actors(f));
    p = await prepared(f, owner);
  });
  afterAll(async () => {
    await f?.close();
  });
  it('Meeting Start insert failure leaves no snapshot/shared/live state/receipt and same-intent retry succeeds', async () => {
    const id = await createMeetingFor(f, owner, p),
      body = { operationId: op(), expectedStamp: 0, action: 'START' };
    await f.pool.query(
      "create function final_fail_start() returns trigger language plpgsql as $$ begin if NEW.meeting_id='" +
        id +
        "'::uuid then raise exception 'forced start failure'; end if; return NEW; end $$; create trigger final_fail_start before insert on meeting_shared_state for each row execute function final_fail_start()",
    );
    try {
      expect((await post(f, meetingUrl(id) + '/commands', body, owner)).statusCode).toBe(500);
      const m = await view(f, id, owner);
      expect(m.state).toBe('DRAFT');
      expect(m.changeStamp).toBe(0);
      expect(m.snapshot).toBeNull();
      expect(m.shared).toBeNull();
      expect(
        (await f.pool.query('select id from operation_results where id=$1', [body.operationId]))
          .rowCount,
      ).toBe(0);
    } finally {
      await f.pool.query(
        'drop trigger final_fail_start on meeting_shared_state;drop function final_fail_start()',
      );
    }
    const retry = await post(f, meetingUrl(id) + '/commands', body, owner);
    expect(retry.statusCode, retry.body).toBe(200);
  });
  for (const action of ['SHARE', 'UPDATE'] as const) {
    it(
      action +
        ' publication failure rolls back item/revision/pointer/stamp/receipt then retries safely',
      async () => {
        const id = await createMeetingFor(f, owner, p);
        await start(f, owner, id);
        const note = await post(
          f,
          meetingUrl(id) + '/private/items',
          {
            operationId: op(),
            category: 'NOTE',
            title: 'Explicit shared note',
            body: 'Intended text',
          },
          owner,
        );
        expect(note.statusCode).toBe(200);
        let m = await view(f, id, owner),
          publicationId: string | undefined;
        if (action === 'UPDATE') {
          const shared = await post(
            f,
            meetingUrl(id) + '/publications',
            {
              operationId: op(),
              expectedStamp: m.changeStamp,
              action: 'SHARE',
              category: 'NOTE',
              origin: { kind: 'KNOWLEDGE', id: note.json().data.id, expectedItemStamp: 0 },
              scope: p.scope,
            },
            owner,
          );
          expect(shared.statusCode, shared.body).toBe(200);
          publicationId = shared.json().data.id;
          m = await view(f, id, owner);
        }
        const body = {
          operationId: op(),
          expectedStamp: m.changeStamp,
          action,
          ...(action === 'SHARE'
            ? { category: 'NOTE' }
            : { publicationId, expectedPublicationStamp: 0 }),
          origin: { kind: 'KNOWLEDGE', id: note.json().data.id, expectedItemStamp: 0 },
          scope: p.scope,
        };
        await f.pool.query(
          "create function final_fail_publish() returns trigger language plpgsql as $$ begin if exists(select 1 from shared_meeting_items where id=NEW.publication_id and meeting_id='" +
            id +
            "'::uuid) then raise exception 'forced publication failure'; end if; return NEW; end $$;create trigger final_fail_publish before insert on shared_meeting_item_revisions for each row execute function final_fail_publish()",
        );
        try {
          expect((await post(f, meetingUrl(id) + '/publications', body, owner)).statusCode).toBe(
            500,
          );
          const after = await view(f, id, owner);
          expect(after.changeStamp).toBe(m.changeStamp);
          expect(after.context.publications).toEqual(m.context.publications);
          expect(
            (await f.pool.query('select id from operation_results where id=$1', [body.operationId]))
              .rowCount,
          ).toBe(0);
          expect(
            (await f.pool.query('select id from shared_meeting_items where meeting_id=$1', [id]))
              .rowCount,
          ).toBe(action === 'SHARE' ? 0 : 1);
        } finally {
          await f.pool.query(
            'drop trigger final_fail_publish on shared_meeting_item_revisions;drop function final_fail_publish()',
          );
        }
        const retry = await post(f, meetingUrl(id) + '/publications', body, owner);
        expect(retry.statusCode, retry.body).toBe(200);
        const after = await view(f, id, owner);
        expect(after.context.publications[0].sequence).toBe(action === 'SHARE' ? 1 : 2);
      },
    );
  }
});
