import { MeetingAdmission } from '../src/modules/meetings/meeting.admission.js';
import { domainWrites } from '../src/app/domain-writes.js';
import { authenticatedPrincipal } from './foundation.fixture.js';
import { DomainEvents } from '../src/shared/events/domain-events.js';
import { CommandTransactions } from '../src/shared/database/command-transaction.js';
import { IdempotentOperations } from '../src/shared/operations/idempotent-operation.js';
import { SemanticFingerprint } from '../src/shared/operations/semantic-fingerprint.js';
import { OutcomeService } from '../src/modules/outcomes/outcome.service.js';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { prepared, meetingUrl, createMeetingFor, start, view, command } from './meeting.fixture.js';
import { ended, candidates, readReview, cmd, ok, post, op, reviewUrl } from './outcome.fixture.js';
describe('Human-reviewed outcomes, atomic Save and derived project knowledge', () => {
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
  const build = async () => {
    const a = await make();
    await candidates(f, a.reviewId, owner, a.participantId);
    return a;
  };
  const ready = async (id: string) => ok(f, id, owner, { action: 'READY', confirmed: true });
  const save = async (id: string) => ok(f, id, owner, { action: 'SAVE', confirmed: true });
  const project = async (kind: string, actor = owner) =>
    await f.app.inject({
      url: '/api/v1/projects/' + p.projectId + '/' + kind,
      headers: actor.headers,
    });
  it('Decision/Action creation needs explicit human discussion/promotion', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner);
    expect(r.actions).toEqual([]);
    expect(r.decisions).toEqual([]);
    expect(
      (
        await cmd(f, a.reviewId, owner, {
          action: 'DECISION',
          itemIds: [r.items[0].id],
          title: 'Not reviewed',
          statement: 'Not accepted',
          rationale: '',
          evidenceKeys: [],
        })
      ).statusCode,
    ).toBe(400);
  });
  it('draft candidates keep stable identity, origin project and exact assessment links', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner);
    expect(r.decisions).toHaveLength(1);
    expect(r.actions).toHaveLength(1);
    expect(r.decisions[0]).toMatchObject({
      projectId: p.projectId,
      meetingId: a.id,
      reviewId: a.reviewId,
      acceptedBy: null,
      createdBy: owner.id,
    });
    expect(r.actions[0]).toMatchObject({
      status: 'OPEN',
      dueDate: '2026-11-02',
      assigneeParticipantId: a.participantId,
      assignee: { kind: 'USER', userId: editor.id },
      acceptedBy: null,
    });
    const id = r.decisions[0].id;
    await ok(f, a.reviewId, owner, {
      action: 'DECISION',
      decisionId: id,
      itemIds: [r.items[0].id],
      title: 'Edited',
      statement: 'Still human',
      rationale: 'Updated reason',
      evidenceKeys: [],
    });
    expect((await readReview(f, a.reviewId, owner)).decisions[0].id).toBe(id);
  });
  it('drafts do not appear in project knowledge or activity', async () => {
    const before = (await project('outcome-activity')).json().data;
    const a = await build();
    expect(
      (await project('decisions'))
        .json()
        .data.items.some((x: { reviewId: string }) => x.reviewId === a.reviewId),
    ).toBe(false);
    expect(
      (await project('actions'))
        .json()
        .data.items.some((x: { reviewId: string }) => x.reviewId === a.reviewId),
    ).toBe(false);
    expect((await project('outcome-activity')).json().data).toEqual(before);
  });
  it('validates assignee against frozen actors without granting membership or private rights', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner),
      action = r.actions[0];
    expect(
      (
        await cmd(f, a.reviewId, owner, {
          action: 'ACTION',
          actionId: action.id,
          itemIds: [r.items[1].id],
          title: 'Invalid assignee',
          description: '',
          assigneeParticipantId: op(),
          dueDate: null,
          decisionId: null,
          evidenceKeys: [],
        })
      ).statusCode,
    ).toBe(400);
    expect((await project('actions', editor)).statusCode).toBe(404);
    expect(
      (
        await f.pool.query(
          'select user_id from project_editors where project_id=$1 and user_id=$2',
          [p.projectId, editor.id],
        )
      ).rowCount,
    ).toBe(0);
  });
  it('unassigned action draft cannot be accepted', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner),
      action = r.actions[0];
    await ok(f, a.reviewId, owner, {
      action: 'ACTION',
      actionId: action.id,
      itemIds: [r.items[1].id],
      title: action.title,
      description: action.description,
      assigneeParticipantId: null,
      dueDate: null,
      decisionId: null,
      evidenceKeys: [],
    });
    expect((await cmd(f, a.reviewId, owner, { action: 'READY', confirmed: true })).statusCode).toBe(
      400,
    );
    expect((await readReview(f, a.reviewId, owner)).state).toBe('REVIEWING');
  });
  it('supports many assessments per Decision and Decision plus Action on same assessment', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner);
    await ok(f, a.reviewId, owner, {
      action: 'DECISION',
      decisionId: r.decisions[0].id,
      itemIds: [r.items[0].id, r.items[1].id],
      title: 'Multi-source',
      statement: 'Explicit combined decision',
      rationale: '',
      evidenceKeys: [],
    });
    await ok(f, a.reviewId, owner, {
      action: 'ACTION',
      actionId: r.actions[0].id,
      itemIds: [r.items[0].id, r.items[1].id],
      title: 'Linked task',
      description: '',
      assigneeParticipantId: a.participantId,
      dueDate: null,
      decisionId: r.decisions[0].id,
      evidenceKeys: [],
    });
    await ready(a.reviewId);
    const after = await readReview(f, a.reviewId, owner);
    expect(after.links).toHaveLength(4);
    expect(after.actions[0].decisionId).toBe(r.decisions[0].id);
  });
  it('rejects cross-review outcome/assessment references', async () => {
    const a = await build(),
      b = await build(),
      ra = await readReview(f, a.reviewId, owner),
      rb = await readReview(f, b.reviewId, owner);
    expect(
      (
        await cmd(f, a.reviewId, owner, {
          action: 'DECISION',
          decisionId: rb.decisions[0].id,
          itemIds: [ra.items[0].id],
          title: 'Bad',
          statement: 'Bad',
          rationale: '',
          evidenceKeys: [],
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await cmd(f, a.reviewId, owner, {
          action: 'ACTION',
          itemIds: [rb.items[0].id],
          title: 'Bad',
          description: '',
          assigneeParticipantId: a.participantId,
          dueDate: null,
          decisionId: null,
          evidenceKeys: [],
        })
      ).statusCode,
    ).toBe(400);
  });
  it('requires candidate definitions for Decision/Action classifications', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner);
    await ok(f, a.reviewId, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DISCUSSED',
    });
    await ok(f, a.reviewId, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DECISION',
    });
    expect((await cmd(f, a.reviewId, owner, { action: 'READY', confirmed: true })).statusCode).toBe(
      400,
    );
  });
  it('cannot ignore an assessment that still supplies an intended outcome', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner);
    await ok(f, a.reviewId, owner, { action: 'RETAIN', itemId: r.items[0].id, retained: false });
    expect((await cmd(f, a.reviewId, owner, { action: 'READY', confirmed: true })).statusCode).toBe(
      400,
    );
  });
  it('removes unwanted candidate links then permits assessment correction', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner);
    await ok(f, a.reviewId, owner, {
      action: 'REMOVE_OUTCOME',
      kind: 'DECISION',
      outcomeId: r.decisions[0].id,
    });
    await ok(f, a.reviewId, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DISCUSSED',
    });
    await ok(f, a.reviewId, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'ADDRESSED',
    });
    await ready(a.reviewId);
    expect((await readReview(f, a.reviewId, owner)).decisions).toEqual([]);
  });
  it('explicit readiness freezes intended draft until explicit reopen', async () => {
    const a = await build();
    await ready(a.reviewId);
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'Not accepted' })).statusCode,
    ).toBe(409);
    await ok(f, a.reviewId, owner, { action: 'REOPEN' });
    await ok(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'Revised human summary' });
    expect((await cmd(f, a.reviewId, owner, { action: 'SAVE', confirmed: true })).statusCode).toBe(
      409,
    );
  });
  it('Save requires owner and explicit confirmation, not participant or temporary presenter', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner);
    expect(
      (
        await post(
          f,
          reviewUrl(a.reviewId) + '/commands',
          { operationId: op(), expectedStamp: r.changeStamp, action: 'SAVE', confirmed: true },
          editor,
        )
      ).statusCode,
    ).toBe(404);
    expect((await cmd(f, a.reviewId, owner, { action: 'SAVE', confirmed: false })).statusCode).toBe(
      400,
    );
  });
  it('Save atomically accepts existing IDs, freezes all results and keeps Architecture unchanged', async () => {
    const a = await build();
    await ready(a.reviewId);
    const before = await readReview(f, a.reviewId, owner);
    const graph = await f.pool.query(
      'select id,change_stamp,state from architectures where id=$1',
      [p.architectureId],
    );
    await save(a.reviewId);
    const after = await readReview(f, a.reviewId, owner);
    expect(after.state).toBe('SAVED');
    expect(after.manifest.decisionIds).toEqual(before.decisions.map((d: { id: string }) => d.id));
    expect(after.manifest.actionIds).toEqual(before.actions.map((d: { id: string }) => d.id));
    expect(after.decisions[0].acceptedBy).toBe(owner.id);
    expect(after.actions[0].acceptedBy).toBe(owner.id);
    expect(after.manifest.unresolvedIds).toHaveLength(1);
    expect(
      (
        await f.pool.query('select id,change_stamp,state from architectures where id=$1', [
          p.architectureId,
        ])
      ).rows,
    ).toEqual(graph.rows);
    expect(
      (await project('decisions'))
        .json()
        .data.items.some((d: { id: string }) => d.id === before.decisions[0].id),
    ).toBe(true);
  });
  it('same Save intent returns original result IDs and stamp after retry', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner),
      body = { operationId: op(), expectedStamp: r.changeStamp, action: 'SAVE', confirmed: true };
    const first = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner),
      retry = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner);
    expect(first.statusCode, first.body).toBe(200);
    expect(retry.json().data).toEqual({ ...first.json().data, replayed: true });
    expect((await readReview(f, a.reviewId, owner)).manifest.decisionIds).toEqual(
      r.decisions.map((d: { id: string }) => d.id),
    );
  });
  it('new Save intent after SAVED rejects; content and linked definitions are immutable', async () => {
    const a = await build();
    await ready(a.reviewId);
    await save(a.reviewId);
    expect((await cmd(f, a.reviewId, owner, { action: 'SAVE', confirmed: true })).statusCode).toBe(
      409,
    );
    expect((await cmd(f, a.reviewId, owner, { action: 'REOPEN' })).statusCode).toBe(409);
    expect(
      (await cmd(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'Rewrite' })).statusCode,
    ).toBe(409);
    const r = await readReview(f, a.reviewId, owner);
    await expect(
      f.pool.query("update meeting_reviews set summary='tamper' where id=$1", [a.reviewId]),
    ).rejects.toThrow();
    await expect(
      f.pool.query("update meeting_review_items set summary='tamper' where id=$1", [r.items[0].id]),
    ).rejects.toThrow();
    await expect(
      f.pool.query("update decisions set statement='tamper' where id=$1", [r.decisions[0].id]),
    ).rejects.toThrow();
    await expect(
      f.pool.query('delete from action_items where id=$1', [r.actions[0].id]),
    ).rejects.toThrow();
    await expect(
      f.pool.query('delete from review_outcome_links where review_id=$1', [a.reviewId]),
    ).rejects.toThrow();
  });
  it('concurrent duplicate Save operation returns one durable logical result', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner),
      body = { operationId: op(), expectedStamp: r.changeStamp, action: 'SAVE', confirmed: true };
    const results = await Promise.all([
      post(f, reviewUrl(a.reviewId) + '/commands', body, owner),
      post(f, reviewUrl(a.reviewId) + '/commands', body, owner),
    ]);
    expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
    expect(results.map((r) => r.json().data.replayed).sort()).toEqual([false, true]);
    expect(
      (await f.pool.query('select id from operation_results where id=$1', [body.operationId]))
        .rowCount,
    ).toBe(1);
  });
  it('concurrent distinct Save intentions accept once and stale competitor conflicts', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner);
    const results = await Promise.all(
      [op(), op()].map((operationId) =>
        post(
          f,
          reviewUrl(a.reviewId) + '/commands',
          { operationId, expectedStamp: r.changeStamp, action: 'SAVE', confirmed: true },
          owner,
        ),
      ),
    );
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
  });
  it('Save racing reopen/edit cannot silently drop accepted work', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner);
    const results = await Promise.all(
      ['SAVE', 'REOPEN'].map((action) =>
        post(
          f,
          reviewUrl(a.reviewId) + '/commands',
          {
            operationId: op(),
            expectedStamp: r.changeStamp,
            action,
            ...(action === 'SAVE' ? { confirmed: true } : {}),
          },
          owner,
        ),
      ),
    );
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    const after = await readReview(f, a.reviewId, owner);
    expect(['SAVED', 'REVIEWING']).toContain(after.state);
    expect(after.changeStamp).toBe(r.changeStamp + 1);
    if (after.state === 'REVIEWING') {
      await ok(f, a.reviewId, owner, { action: 'SUMMARY', summary: 'Edit after reopen' });
      await ready(a.reviewId);
      await save(a.reviewId);
      expect((await readReview(f, a.reviewId, owner)).summary).toBe('Edit after reopen');
    }
  });
  for (const table of ['decisions', 'action_items']) {
    it(
      'failure during ' + table + ' acceptance rolls back all publication, stamp and receipt',
      async () => {
        const a = await build();
        await ready(a.reviewId);
        const r = await readReview(f, a.reviewId, owner),
          body = {
            operationId: op(),
            expectedStamp: r.changeStamp,
            action: 'SAVE',
            confirmed: true,
          };
        await f.pool.query(
          "create function test_fail_accept() returns trigger language plpgsql as $$ begin if NEW.review_id='" +
            a.reviewId +
            "'::uuid and NEW.accepted_by is not null then raise exception 'forced acceptance failure'; end if; return NEW; end $$",
        );
        await f.pool.query(
          'create trigger test_fail_accept before update on ' +
            table +
            ' for each row execute function test_fail_accept()',
        );
        try {
          const failed = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner);
          expect(failed.statusCode).toBe(500);
          const after = await readReview(f, a.reviewId, owner);
          expect(after.state).toBe('READY_TO_SAVE');
          expect(after.changeStamp).toBe(r.changeStamp);
          expect(after.manifest).toBeNull();
          expect(after.decisions.every((d: { acceptedBy: null }) => d.acceptedBy === null)).toBe(
            true,
          );
          expect(after.actions.every((d: { acceptedBy: null }) => d.acceptedBy === null)).toBe(
            true,
          );
          expect(
            (await f.pool.query('select id from operation_results where id=$1', [body.operationId]))
              .rowCount,
          ).toBe(0);
        } finally {
          await f.pool.query('drop trigger test_fail_accept on ' + table);
          await f.pool.query('drop function test_fail_accept()');
        }
        const retry = await post(f, reviewUrl(a.reviewId) + '/commands', body, owner);
        expect(retry.statusCode, retry.body).toBe(200);
      },
    );
  }
  it('unresolved, deferred, addressed and unknown remain deliberate discoverable assessments', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner);
    for (const [idx, classification] of ['UNRESOLVED', 'DEFERRED', 'ADDRESSED'].entries()) {
      const itemId = r.items[idx].id;
      await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification: 'DISCUSSED' });
      await ok(f, a.reviewId, owner, { action: 'CLASSIFY', itemId, classification });
    }
    await ok(f, a.reviewId, owner, {
      action: 'ADD_MANUAL',
      title: 'Unknown discussion state',
      summary: 'No inference',
      evidenceKeys: [],
    });
    await ready(a.reviewId);
    await save(a.reviewId);
    const after = await readReview(f, a.reviewId, owner);
    expect(after.manifest.unresolvedIds).toHaveLength(1);
    expect(after.manifest.deferredIds).toHaveLength(1);
    expect(after.decisions).toEqual([]);
    expect(after.actions).toEqual([]);
    const assessments = (await project('assessments'))
      .json()
      .data.items.filter((i: { reviewId: string }) => i.reviewId === a.reviewId);
    expect(assessments.map((i: { classification: string }) => i.classification).sort()).toEqual([
      'ADDRESSED',
      'DEFERRED',
      'RAISED',
      'UNRESOLVED',
    ]);
  });
  it('derived activity reflects only saved counts without a Home truth table', async () => {
    const before = (await project('outcome-activity')).json().data,
      a = await build();
    await ready(a.reviewId);
    await save(a.reviewId);
    const after = (await project('outcome-activity')).json().data;
    expect(after.decisions).toBe(before.decisions + 1);
    expect(after.openActions).toBe(before.openActions + 1);
    expect(after.unresolved).toBe(before.unresolved + 1);
    expect(after.latest).toMatchObject({
      reviewId: a.reviewId,
      meetingId: a.id,
      title: 'Architecture review',
    });
    expect(after.latest.savedAt).toBeTruthy();
    const tables = await f.pool.query(
      "select table_name from information_schema.tables where table_schema='public' and table_name in ('home_activities','project_outcomes','meeting_outcomes','my_spaces')",
    );
    expect(tables.rowCount).toBe(0);
  });
  it('saved project readers see retained results but ignored draft text stays owner-only', async () => {
    const a = await make(),
      r = await readReview(f, a.reviewId, owner),
      itemId = r.items[0].id;
    await ok(f, a.reviewId, owner, {
      action: 'EDIT_ITEM',
      itemId,
      title: 'Ignored secret draft',
      summary: 'Not retained',
    });
    await ok(f, a.reviewId, owner, { action: 'RETAIN', itemId, retained: false });
    await ready(a.reviewId);
    await save(a.reviewId);
    // Explicit project read grant; being a Meeting participant alone was insufficient.
    await f.pool.query(
      'insert into project_editors(project_id,user_id,added_by_user_id) values($1,$2,$3)',
      [p.projectId, editor.id, owner.id],
    );
    try {
      const response = await f.app.inject({ url: reviewUrl(a.reviewId), headers: editor.headers });
      expect(response.statusCode, response.body).toBe(200);
      expect(JSON.stringify(response.json())).not.toContain('Ignored secret draft');
      expect(response.json().data.items).toHaveLength(2);
      expect(
        (
          await post(
            f,
            reviewUrl(a.reviewId) + '/commands',
            {
              operationId: op(),
              expectedStamp: response.json().data.changeStamp,
              action: 'REOPEN',
            },
            editor,
          )
        ).statusCode,
      ).toBe(404);
    } finally {
      await f.pool.query('delete from project_editors where project_id=$1 and user_id=$2', [
        p.projectId,
        editor.id,
      ]);
    }
    expect(
      (await f.app.inject({ url: reviewUrl(a.reviewId), headers: editor.headers })).statusCode,
    ).toBe(404);
    expect((await project('decisions', outsider)).statusCode).toBe(404);
  });
  it('database prevents retargeting review/candidate bindings or partial acceptance', async () => {
    const a = await build(),
      r = await readReview(f, a.reviewId, owner),
      b = await make();
    await expect(
      f.pool.query('update meeting_reviews set capture_id=$1 where id=$2', [
        b.captureId,
        a.reviewId,
      ]),
    ).rejects.toThrow();
    await expect(
      f.pool.query('update meeting_review_items set source_key=$1 where id=$2', [
        'publication:' + op(),
        r.items[0].id,
      ]),
    ).rejects.toThrow();
    await expect(
      f.pool.query('update decisions set accepted_by=$1 where id=$2', [
        owner.id,
        r.decisions[0].id,
      ]),
    ).rejects.toThrow();
    await expect(
      f.pool.query('update action_items set assignee_participant_id=$1 where id=$2', [
        b.participantId,
        r.actions[0].id,
      ]),
    ).rejects.toThrow();
  });

  it('commit-time failure retains READY draft and returns no success receipt', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner);
    const body = {
      operationId: op(),
      expectedStamp: r.changeStamp,
      action: 'SAVE',
      confirmed: true,
    };
    await f.pool.query(
      "create function test_fail_commit() returns trigger language plpgsql as $$ begin if NEW.id='" +
        a.reviewId +
        "'::uuid and NEW.state='SAVED' then raise exception 'forced commit failure'; end if; return null; end $$",
    );
    await f.pool.query(
      'create constraint trigger test_fail_commit after update on meeting_reviews deferrable initially deferred for each row execute function test_fail_commit()',
    );
    try {
      expect((await post(f, reviewUrl(a.reviewId) + '/commands', body, owner)).statusCode).toBe(
        500,
      );
      const after = await readReview(f, a.reviewId, owner);
      expect(after.state).toBe('READY_TO_SAVE');
      expect(after.manifest).toBeNull();
      expect(after.changeStamp).toBe(r.changeStamp);
      expect(
        (await f.pool.query('select id from operation_results where id=$1', [body.operationId]))
          .rowCount,
      ).toBe(0);
    } finally {
      await f.pool.query('drop trigger test_fail_commit on meeting_reviews');
      await f.pool.query('drop function test_fail_commit()');
    }
    expect((await post(f, reviewUrl(a.reviewId) + '/commands', body, owner)).statusCode).toBe(200);
  });
  it('guest Snapshot and responsible attribution are safe frozen references without granting review access', async () => {
    const id = await createMeetingFor(f, owner, p);
    await start(f, owner, id);
    const issued = await new MeetingAdmission(f.db, domainWrites(f.db, f.config)).guest(
      await authenticatedPrincipal(f, owner),
      id,
      new Date(Date.now() + 3600000),
    );
    const guest = { ...outsider, headers: { authorization: 'Bearer ' + issued.token } };
    const snap = await post(
      f,
      meetingUrl(id) + '/private/snapshots',
      {
        operationId: op(),
        scope: p.scope,
        payload: { format: 1, title: 'Intentionally shared snapshot' },
      },
      guest,
    );
    expect(snap.statusCode, snap.body).toBe(200);
    const m = await view(f, id, owner);
    const share = await post(
      f,
      meetingUrl(id) + '/publications',
      {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'SNAPSHOT',
        origin: { kind: 'SNAPSHOT', id: snap.json().data.id },
        scope: p.scope,
      },
      guest,
    );
    expect(share.statusCode, share.body).toBe(200);
    const end = await command(f, owner, id, { action: 'END' });
    expect(end.statusCode, end.body).toBe(200);
    const endedMeeting = await view(f, id, owner);
    const create = await post(
      f,
      meetingUrl(id) + '/review',
      { operationId: op(), captureId: endedMeeting.frozenCapture.id },
      owner,
    );
    expect(create.statusCode, create.body).toBe(200);
    const rid = create.json().data.id,
      r = await readReview(f, rid, owner),
      actor = r.source.participants.find(
        (a: { actor: { kind: string } }) => a.actor.kind === 'SCOPED_GUEST',
      );
    expect(r.source.entries[0].representation.payload.title).toBe('Intentionally shared snapshot');
    expect(JSON.stringify(r.source)).not.toContain(snap.json().data.id);
    await ok(f, rid, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DISCUSSED',
    });
    await ok(f, rid, owner, {
      action: 'ACTION',
      itemIds: [r.items[0].id],
      title: 'Document snapshot',
      description: 'Explicit task',
      assigneeParticipantId: actor.id,
      dueDate: null,
      decisionId: null,
      evidenceKeys: [r.source.entries[0].key],
    });
    await ready(rid);
    await save(rid);
    const saved = await readReview(f, rid, owner);
    expect(saved.actions[0].assignee).toEqual(actor.actor);
    expect((await f.app.inject({ url: reviewUrl(rid), headers: guest.headers })).statusCode).toBe(
      401,
    );
  });
  it('post-commit listener failure cannot undo accepted truth or durable replay', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner);
    const events = new DomainEvents();
    let calls = 0;
    events.subscribe('meeting_review.saved', 'unavailable-listener', () => {
      calls++;
      throw new Error('listener unavailable');
    });
    const writes = new IdempotentOperations(
      new CommandTransactions(f.db, events),
      new SemanticFingerprint(Buffer.from(f.config.ACCESS_TOKEN_SECRET)),
    );
    const service = new OutcomeService(f.db, writes),
      principal = await authenticatedPrincipal(f, owner);
    const input = {
      operationId: op(),
      expectedStamp: r.changeStamp,
      action: 'SAVE' as const,
      confirmed: true as const,
    };
    const first = await service.command(principal, a.reviewId, input),
      retry = await service.command(principal, a.reviewId, input);
    expect(first.state).toBe('SAVED');
    expect(retry.manifest).toEqual(first.manifest);
    expect(retry.replayed).toBe(true);
    expect(calls).toBe(1);
  });
  it('Save operation identity cannot be reused with changed intent', async () => {
    const a = await build();
    await ready(a.reviewId);
    const r = await readReview(f, a.reviewId, owner),
      body = { operationId: op(), expectedStamp: r.changeStamp, action: 'SAVE', confirmed: true };
    expect((await post(f, reviewUrl(a.reviewId) + '/commands', body, owner)).statusCode).toBe(200);
    expect(
      (
        await post(
          f,
          reviewUrl(a.reviewId) + '/commands',
          { ...body, expectedStamp: r.changeStamp + 1 },
          owner,
        )
      ).statusCode,
    ).toBe(409);
  });
});
