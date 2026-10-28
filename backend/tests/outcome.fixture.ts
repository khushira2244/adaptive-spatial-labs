import { expect } from 'vitest';
import type { Fixture, Actor } from './fixture.js';
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
export { post, op };
export const reviewUrl = (id: string) => '/api/v1/reviews/' + id;
export const readReview = async (f: Fixture, id: string, actor: Actor) =>
  (await f.app.inject({ url: reviewUrl(id) + '?limit=100', headers: actor.headers })).json().data;
export async function cmd(f: Fixture, id: string, actor: Actor, input: Record<string, unknown>) {
  const r = await readReview(f, id, actor);
  return post(
    f,
    reviewUrl(id) + '/commands',
    { operationId: op(), expectedStamp: r.changeStamp, ...input },
    actor,
  );
}
export async function ok(f: Fixture, id: string, actor: Actor, input: Record<string, unknown>) {
  const res = await cmd(f, id, actor, input);
  expect(res.statusCode, res.body).toBe(200);
  return res.json().data;
}
export async function ended(
  f: Fixture,
  owner: Actor,
  editor: Actor,
  p: Awaited<ReturnType<typeof prepared>>,
  create = true,
) {
  const id = await createMeetingFor(f, owner, p);
  await start(f, owner, id);
  const participantId = await admit(f, owner, id, editor);
  const note = async (title: string) => {
    const res = await post(
      f,
      meetingUrl(id) + '/private/items',
      { operationId: op(), category: 'NOTE', title, body: 'Captured body' },
      editor,
    );
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data.id as string;
  };
  const hidden = await note('Unshared secret'),
    origin = await note('Shared question');
  const publications: string[] = [];
  for (const category of ['QUESTION', 'ACTION_SUGGESTION', 'NOTE']) {
    const m = await view(f, id, owner),
      res = await post(
        f,
        meetingUrl(id) + '/publications',
        {
          operationId: op(),
          expectedStamp: m.changeStamp,
          action: 'SHARE',
          category,
          origin: { kind: 'KNOWLEDGE', id: origin, expectedItemStamp: 0 },
          scope: p.scope,
        },
        editor,
      );
    expect(res.statusCode, res.body).toBe(200);
    publications.push(res.json().data.id);
  }
  const withdrawn = await note('Withdrawn secret');
  let m = await view(f, id, owner);
  const shared = await post(
    f,
    meetingUrl(id) + '/publications',
    {
      operationId: op(),
      expectedStamp: m.changeStamp,
      action: 'SHARE',
      category: 'NOTE',
      origin: { kind: 'KNOWLEDGE', id: withdrawn, expectedItemStamp: 0 },
      scope: p.scope,
    },
    editor,
  );
  expect(shared.statusCode, shared.body).toBe(200);
  m = await view(f, id, owner);
  const withdrawal = await post(
    f,
    meetingUrl(id) + '/publications',
    {
      operationId: op(),
      expectedStamp: m.changeStamp,
      action: 'WITHDRAW',
      publicationId: shared.json().data.id,
      expectedPublicationStamp: 0,
    },
    editor,
  );
  expect(withdrawal.statusCode, withdrawal.body).toBe(200);
  const end = await command(f, owner, id, { action: 'END' });
  expect(end.statusCode, end.body).toBe(200);
  m = await view(f, id, owner);
  const captureId = m.frozenCapture.id as string,
    body = { operationId: op(), captureId };
  const created = create ? await post(f, meetingUrl(id) + '/review', body, owner) : null;
  if (created) expect(created.statusCode, created.body).toBe(200);
  return {
    id,
    captureId,
    body,
    reviewId: created?.json().data.id as string,
    participantId,
    origin,
    hidden,
    withdrawn,
    publications,
  };
}
export async function candidates(f: Fixture, rid: string, owner: Actor, participantId: string) {
  let r = await readReview(f, rid, owner);
  for (const i of r.items)
    await ok(f, rid, owner, { action: 'CLASSIFY', itemId: i.id, classification: 'DISCUSSED' });
  r = await readReview(f, rid, owner);
  await ok(f, rid, owner, {
    action: 'DECISION',
    itemIds: [r.items[0].id],
    title: 'Retry owner',
    statement: 'Worker owns retries',
    rationale: 'Explicit human acceptance',
    evidenceKeys: [r.source.evidenceKeys[0]],
  });
  await ok(f, rid, owner, {
    action: 'ACTION',
    itemIds: [r.items[1].id],
    title: 'Document retry',
    description: 'Write the policy',
    assigneeParticipantId: participantId,
    dueDate: '2026-11-02',
    decisionId: null,
    evidenceKeys: [],
  });
  await ok(f, rid, owner, {
    action: 'CLASSIFY',
    itemId: r.items[2].id,
    classification: 'UNRESOLVED',
  });
  return readReview(f, rid, owner);
}
