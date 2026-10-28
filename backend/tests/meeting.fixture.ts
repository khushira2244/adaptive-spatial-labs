import { expect } from 'vitest';
import type { Fixture, Actor } from './fixture.js';
import { architectureContext, op } from './step2.fixture.js';
export const post = (f: Fixture, url: string, payload: unknown, actor: Actor) =>
  f.app.inject({
    method: 'POST',
    url,
    headers: actor.headers,
    payload: payload as Record<string, unknown>,
  });
export const meetingUrl = (id: string) => '/api/v1/meetings/' + id;
export const view = async (f: Fixture, id: string, actor: Actor) =>
  (await f.app.inject({ url: meetingUrl(id), headers: actor.headers })).json().data;
export async function prepared(f: Fixture, owner: Actor) {
  const c = await architectureContext(f, owner);
  expect(
    (await post(f, c.url + '/confirm', { operationId: op(), expectedStamp: 0 }, owner)).statusCode,
  ).toBe(200);
  const response = await post(
    f,
    '/api/v1/presentations',
    { operationId: op(), projectId: c.projectId, name: 'Meeting preparation', purpose: 'Review' },
    owner,
  );
  expect(response.statusCode, response.body).toBe(200);
  const presentationId = response.json().data.id as string,
    purl = '/api/v1/presentations/' + presentationId;
  const builder = async () =>
    (await f.app.inject({ url: purl, headers: owner.headers })).json().data;
  const initial = await builder(),
    main = initial.screens[0].id as string;
  const scope = {
    format: 1 as const,
    kind: 'WHOLE_ARCHITECTURE' as const,
    architectureId: c.architectureId,
    architectureGraphRef: c.family.rootGraphId,
    architectureStamp: 1,
  };
  const body = {
    name: 'Scenario',
    type: 'DISCUSSION',
    scope,
    scenarioGoal: 'Discuss retry',
    notes: 'Prepared',
    understanding: { summary: 'Manual prepared discussion', points: [] },
  };
  const add = await post(
    f,
    purl + '/screens',
    { operationId: op(), expectedStamp: initial.changeStamp, ...body },
    owner,
  );
  expect(add.statusCode, add.body).toBe(200);
  const screen = add.json().data.id as string;
  expect(
    (
      await post(
        f,
        purl + '/screens/' + screen + '/commands',
        { operationId: op(), expectedStamp: 0, action: 'ACCEPT_UNDERSTANDING' },
        owner,
      )
    ).statusCode,
  ).toBe(200);
  expect(
    (
      await post(
        f,
        purl + '/screens/' + screen + '/commands',
        { operationId: op(), expectedStamp: 1, action: 'CONFIRM' },
        owner,
      )
    ).statusCode,
  ).toBe(200);
  const p = await builder();
  const draft = await post(
    f,
    purl + '/screens',
    { operationId: op(), expectedStamp: p.changeStamp, ...body, name: 'Unconfirmed draft' },
    owner,
  );
  expect(draft.statusCode, draft.body).toBe(200);
  return {
    ...c,
    presentationId,
    purl,
    main,
    screen,
    draftId: draft.json().data.id as string,
    scope,
  };
}
export async function createMeetingFor(
  f: Fixture,
  owner: Actor,
  p: Awaited<ReturnType<typeof prepared>>,
  extra: Record<string, unknown> = {},
) {
  const result = await post(
    f,
    '/api/v1/meetings',
    {
      operationId: op(),
      projectId: p.projectId,
      presentationId: p.presentationId,
      title: 'Architecture review',
      startFromScreenId: p.main,
      ...extra,
    },
    owner,
  );
  expect(result.statusCode, result.body).toBe(200);
  return result.json().data.id as string;
}
export async function start(f: Fixture, owner: Actor, id: string) {
  const m = await view(f, id, owner),
    res = await post(
      f,
      meetingUrl(id) + '/commands',
      { operationId: op(), expectedStamp: m.changeStamp, action: 'START' },
      owner,
    );
  expect(res.statusCode, res.body).toBe(200);
  return res.json().data;
}
export async function admit(f: Fixture, owner: Actor, id: string, actor: Actor) {
  const m = await view(f, id, owner),
    invite = await post(
      f,
      meetingUrl(id) + '/invitations',
      {
        operationId: op(),
        expectedStamp: m.changeStamp,
        email:
          actor === owner
            ? 'owner@example.com'
            : actor.id === owner.id
              ? 'owner@example.com'
              : actor.accessToken
                ? 'editor@example.com'
                : 'unused@example.com',
        expiresInDays: 2,
      },
      owner,
    );
  expect(invite.statusCode, invite.body).toBe(200);
  const res = await post(
    f,
    meetingUrl(id) + '/invitations/' + invite.json().data.id + '/respond',
    { operationId: op(), action: 'ACCEPT' },
    actor,
  );
  expect(res.statusCode, res.body).toBe(200);
  return (await view(f, id, actor)).selfParticipantId as string;
}
export async function command(
  f: Fixture,
  owner: Actor,
  id: string,
  body: Record<string, unknown>,
  actor = owner,
) {
  const m = await view(f, id, actor);
  return post(
    f,
    meetingUrl(id) + '/commands',
    { operationId: op(), expectedStamp: m.changeStamp, ...body },
    actor,
  );
}
