import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { architectureContext, op } from './step2.fixture.js';
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
import { ended, candidates, ok, readReview } from './outcome.fixture.js';
import { FakeAIProvider, nodeVisual } from './ai.fixture.js';
import { Inbox } from './meeting.ws-fixture.js';
describe('Final V1 cross-domain lifecycle seams', () => {
  let f: Fixture, owner: Actor, editor: Actor, p: Awaited<ReturnType<typeof prepared>>;
  const fake = new FakeAIProvider();
  beforeAll(async () => {
    f = await fixture(fake);
    ({ owner, editor } = await actors(f));
    p = await prepared(f, owner);
  });
  afterAll(async () => {
    await f?.close();
  });
  beforeEach(() => fake.reset());
  const get = async (url: string, actor = owner) =>
    (await f.app.inject({ url, headers: actor.headers })).json().data;
  it('FLOW1 Source/import -> correction -> confirmation -> private Knowledge -> confirmed visual definition', async () => {
    const c = await architectureContext(f, owner),
      nodeId = c.family.graphs[0]!.nodes[0]!.id;
    for (const [stamp, body] of [
      [0, { action: 'RENAME_NODE', nodeId, name: 'Reviewed payment' }],
      [1, { action: 'DONE' }],
    ] as const) {
      const r = await post(
        f,
        c.url + '/corrections',
        { operationId: op(), expectedStamp: stamp, ...body },
        owner,
      );
      expect(r.statusCode, r.body).toBe(200);
    }
    expect(
      (await post(f, c.url + '/confirm', { operationId: op(), expectedStamp: 2 }, owner))
        .statusCode,
    ).toBe(200);
    const canonical = await get(c.url);
    expect(canonical.state).toBe('CONFIRMED');
    const scope = {
      format: 1,
      kind: 'WHOLE_ARCHITECTURE',
      architectureId: c.architectureId,
      architectureGraphRef: c.family.rootGraphId,
      architectureStamp: canonical.changeStamp,
    };
    const note = await post(
      f,
      '/api/v1/knowledge',
      {
        operationId: op(),
        projectId: c.projectId,
        category: 'QUESTION',
        title: 'Review question',
        body: 'Who owns retries?',
        attachments: [{ kind: 'ARCHITECTURE', scope }],
      },
      owner,
    );
    expect(note.statusCode, note.body).toBe(200);
    const pres = await post(
      f,
      '/api/v1/presentations',
      { operationId: op(), projectId: c.projectId, name: 'Reliability', purpose: 'Review' },
      owner,
    );
    expect(pres.statusCode, pres.body).toBe(200);
    const url = '/api/v1/presentations/' + pres.json().data.id;
    const add = await post(
      f,
      url + '/screens',
      {
        operationId: op(),
        expectedStamp: 0,
        name: 'Failure',
        type: 'FAILURE',
        scope,
        scenarioGoal: 'Understand database failure',
        notes: 'Human preparation',
        understanding: { summary: 'Retries need review', points: [] },
      },
      owner,
    );
    expect(add.statusCode, add.body).toBe(200);
    const sid = add.json().data.id,
      route = url + '/screens/' + sid + '/commands';
    let screen = (await get(url)).screens.find((s: { id: string }) => s.id === sid);
    for (const input of [
      { action: 'ACCEPT_UNDERSTANDING' },
      { action: 'NODE_VISUAL', nodeId, visual: { ...nodeVisual, state: 'FAILURE' } },
      {
        action: 'INCLUDE_KNOWLEDGE',
        itemId: note.json().data.id,
        expectedItemStamp: 0,
        includeBody: true,
      },
      { action: 'CONFIRM' },
    ]) {
      const res = await post(
        f,
        route,
        { operationId: op(), expectedStamp: screen.changeStamp, ...input },
        owner,
      );
      expect(res.statusCode, res.body).toBe(200);
      screen = (await get(url)).screens.find((s: { id: string }) => s.id === sid);
    }
    const def = await get(url + '/definitions/' + screen.lastConfirmedDefinitionId);
    expect(def.definition.draft.nodeOverrides[0].visual.state).toBe('FAILURE');
    expect(def.definition.inclusions[0].representation.body).toBe('Who owns retries?');
    expect(JSON.stringify(def)).not.toContain(note.json().data.id);
    expect(await get(c.url)).toEqual(canonical);
    expect(
      (
        await f.app.inject({
          url: '/api/v1/knowledge/' + note.json().data.id,
          headers: editor.headers,
        })
      ).statusCode,
    ).toBe(404);
    const frozen = JSON.stringify(def);
    await post(
      f,
      route,
      {
        operationId: op(),
        expectedStamp: screen.changeStamp,
        action: 'EDIT',
        name: 'New draft',
        scenarioGoal: 'Changed',
        notes: 'New',
        understanding: { summary: 'Changed', points: [] },
      },
      owner,
    );
    expect(JSON.stringify(await get(url + '/definitions/' + def.id))).toBe(frozen);
  });
  const meetingFlow = async () => {
    const id = await createMeetingFor(f, owner, p),
      pid = await admit(f, owner, id, editor);
    await start(f, owner, id);
    let m = await view(f, id, owner);
    expect(m.snapshot.screens.map((s: { id: string }) => s.id)).toEqual(
      expect.arrayContaining([p.main, p.screen]),
    );
    const request = await command(f, owner, id, {
      action: 'REQUEST_TRANSFER',
      authorityGeneration: m.shared.authorityGeneration,
      targetParticipantId: pid,
    });
    expect(request.statusCode, request.body).toBe(200);
    const accept = await command(
      f,
      owner,
      id,
      { action: 'ACCEPT_TRANSFER', requestId: request.json().data.id },
      editor,
    );
    expect(accept.statusCode, accept.body).toBe(200);
    m = await view(f, id, editor);
    expect(
      (
        await command(
          f,
          owner,
          id,
          {
            action: 'NAVIGATE',
            authorityGeneration: m.shared.authorityGeneration,
            screenId: p.screen,
          },
          editor,
        )
      ).statusCode,
    ).toBe(200);
    const privateResponse = await f.app.inject({
      method: 'PUT',
      url: meetingUrl(id) + '/private/checkpoint',
      headers: editor.headers,
      payload: { expectedStamp: 0, following: false, screenId: p.main },
    });
    expect(privateResponse.statusCode).toBe(200);
    expect(
      (await post(f, meetingUrl(id) + '/return-to-live', {}, editor)).json().data.shared.screenId,
    ).toBe(p.screen);
    const n = await post(
      f,
      meetingUrl(id) + '/private/items',
      {
        operationId: op(),
        category: 'NOTE',
        title: 'Shared retry question',
        body: 'Original body',
      },
      editor,
    );
    expect(n.statusCode).toBe(200);
    m = await view(f, id, editor);
    const share = await post(
      f,
      meetingUrl(id) + '/publications',
      {
        operationId: op(),
        expectedStamp: m.changeStamp,
        action: 'SHARE',
        category: 'QUESTION',
        origin: { kind: 'KNOWLEDGE', id: n.json().data.id, expectedItemStamp: 0 },
        scope: p.scope,
      },
      editor,
    );
    expect(share.statusCode, share.body).toBe(200);
    expect(
      (
        await f.app.inject({
          method: 'PUT',
          url: meetingUrl(id) + '/private/items/' + n.json().data.id,
          headers: editor.headers,
          payload: {
            expectedStamp: 0,
            category: 'NOTE',
            title: 'Shared retry question',
            body: 'Explicit updated body',
          },
        })
      ).statusCode,
    ).toBe(200);
    m = await view(f, id, editor);
    const update = {
      operationId: op(),
      expectedStamp: m.changeStamp,
      action: 'UPDATE',
      publicationId: share.json().data.id,
      expectedPublicationStamp: 0,
      origin: { kind: 'KNOWLEDGE', id: n.json().data.id, expectedItemStamp: 1 },
      scope: p.scope,
    };
    const a = await post(f, meetingUrl(id) + '/publications', update, editor),
      b = await post(f, meetingUrl(id) + '/publications', update, editor);
    expect(a.statusCode, a.body).toBe(200);
    expect(b.json().data.replayed).toBe(true);
    m = await view(f, id, owner);
    expect(m.shared.presenterParticipantId).toBe(pid);
    expect(m.context.publications[0].sequence).toBe(2);
    expect(JSON.stringify(m)).not.toContain(n.json().data.id);
    expect(m).not.toHaveProperty('checkpoint');
    expect((await command(f, owner, id, { action: 'END' })).statusCode).toBe(200);
    const ended = await view(f, id, owner);
    expect(ended.frozenCapture.payload.publications[0].revisionId).toBe(
      m.context.publications[0].revisionId,
    );
    return {
      id,
      pid,
      noteId: n.json().data.id as string,
      captureId: ended.frozenCapture.id as string,
      revisionId: m.context.publications[0].revisionId as string,
    };
  };
  it('FLOW2 start -> transfer -> private exploration -> explicit revision -> immutable End', async () => {
    await meetingFlow();
  });
  it('FLOW3 frozen Meeting -> human Decision/Action -> READY -> atomic Save/reload', async () => {
    const c = await meetingFlow();
    const created = await post(
      f,
      meetingUrl(c.id) + '/review',
      { operationId: op(), captureId: c.captureId },
      owner,
    );
    expect(created.statusCode, created.body).toBe(200);
    const rid = created.json().data.id;
    let r = await readReview(f, rid, owner);
    expect(r.source.entries[0].key).toBe('publication:' + c.revisionId);
    expect(JSON.stringify(r)).not.toContain(c.noteId);
    await ok(f, rid, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DISCUSSED',
    });
    await ok(f, rid, owner, {
      action: 'DECISION',
      itemIds: [r.items[0].id],
      title: 'Retry owner',
      statement: 'Worker owns retries',
      rationale: 'Human review',
      evidenceKeys: [r.source.entries[0].key],
    });
    await ok(f, rid, owner, {
      action: 'ACTION',
      itemIds: [r.items[0].id],
      title: 'Document policy',
      description: 'Write agreed retry policy',
      assigneeParticipantId: c.pid,
      dueDate: null,
      decisionId: null,
      evidenceKeys: [],
    });
    await ok(f, rid, owner, { action: 'READY', confirmed: true });
    r = await readReview(f, rid, owner);
    const save = {
      operationId: op(),
      expectedStamp: r.changeStamp,
      action: 'SAVE',
      confirmed: true,
    };
    const first = await post(f, '/api/v1/reviews/' + rid + '/commands', save, owner),
      retry = await post(f, '/api/v1/reviews/' + rid + '/commands', save, owner);
    expect(first.statusCode, first.body).toBe(200);
    expect(retry.json().data.manifest).toEqual(first.json().data.manifest);
    const saved = await readReview(f, rid, owner);
    expect(saved.state).toBe('SAVED');
    expect(saved.decisions[0].acceptedBy).toBe(owner.id);
    expect(saved.actions[0].acceptedBy).toBe(owner.id);
  });
  it('FLOW4 AI proposal -> explicit human scenario/visual commands -> immutable confirmation', async () => {
    const local = await prepared(f, owner),
      nodeId = local.family.graphs[0]!.nodes[0]!.id,
      root = '/api/v1/ai';
    expect(
      (
        await post(
          f,
          root + '/context/ask',
          {
            context: { kind: 'ARCHITECTURE', projectId: local.projectId, scope: local.scope },
            question: 'Explain retry',
          },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    fake.output = { suggestions: [] };
    expect(
      (
        await post(
          f,
          root + '/discussion-points',
          { context: { kind: 'ARCHITECTURE', projectId: local.projectId, scope: local.scope } },
          owner,
        )
      ).statusCode,
    ).toBe(200);
    let screen = (await get(local.purl)).screens.find((s: { id: string }) => s.id === local.screen);
    const before = screen.changeStamp;
    fake.output = {
      interpretedScenario: 'Human review of retry',
      affectedComponents: [nodeId],
      expectedBehavior: ['Retry safely'],
      interpretation: 'DISCUSSION',
      assumptions: [],
      uncertainties: [],
      references: [],
    };
    const proposed = await post(
      f,
      root + '/scenario/understand',
      {
        presentationId: local.presentationId,
        screenId: local.screen,
        screenType: 'DISCUSSION',
        scenarioGoal: 'Retries',
        notes: '',
      },
      owner,
    );
    expect(proposed.statusCode, proposed.body).toBe(200);
    expect(
      (await get(local.purl)).screens.find((s: { id: string }) => s.id === local.screen)
        .changeStamp,
    ).toBe(before);
    const cmd = async (input: Record<string, unknown>) => {
      screen = (await get(local.purl)).screens.find((s: { id: string }) => s.id === local.screen);
      const res = await post(
        f,
        local.purl + '/screens/' + local.screen + '/commands',
        { operationId: op(), expectedStamp: screen.changeStamp, ...input },
        owner,
      );
      expect(res.statusCode, res.body).toBe(200);
    };
    await cmd({
      action: 'EDIT',
      name: 'AI-assisted draft',
      scenarioGoal: 'Retries',
      notes: 'Human approved',
      understanding: { summary: proposed.json().data.proposal.interpretedScenario, points: [] },
    });
    await cmd({ action: 'ACCEPT_UNDERSTANDING' });
    const prior = (await get(local.purl)).changeStamp;
    fake.output = {
      operations: [
        { action: 'NODE_VISUAL', nodeId, visual: { ...nodeVisual, emphasis: 'HIGHLIGHT' } },
      ],
      explanation: 'Suggested highlight',
      assumptions: [],
      uncertainties: [],
    };
    const visual = await post(
      f,
      root + '/visual-command/translate',
      {
        presentationId: local.presentationId,
        screenId: local.screen,
        instruction: 'Highlight payment',
      },
      owner,
    );
    expect(visual.statusCode, visual.body).toBe(200);
    expect((await get(local.purl)).changeStamp).toBe(prior);
    await cmd(visual.json().data.proposal.operations[0]);
    await cmd({ action: 'CONFIRM' });
    expect(
      (await get(local.purl)).screens.find((s: { id: string }) => s.id === local.screen)
        .meetingEligible,
    ).toBe(true);
  });
  it('FLOW5 frozen AI summary/classification -> human assessment/candidates -> Save', async () => {
    const c = await ended(f, owner, editor, p),
      rid = c.reviewId,
      before = await readReview(f, rid, owner);
    fake.output = {
      summary: 'Questions need review',
      themes: ['Retries'],
      unresolvedTopics: [],
      potentialDecisions: [],
      potentialActions: [],
      references: [],
      assumptions: [],
      uncertainties: [],
    };
    const summary = await post(f, '/api/v1/ai/meetings/' + c.id + '/summary', {}, owner);
    expect(summary.statusCode, summary.body).toBe(200);
    fake.output = {
      suggestions: [
        {
          itemId: before.items[0].id,
          classification: 'DISCUSSED',
          rationale: 'Verify discussion',
          references: [],
          decision: null,
          action: null,
        },
      ],
      assumptions: [],
      uncertainties: [],
    };
    const classification = await post(f, '/api/v1/ai/reviews/' + rid + '/classify', {}, owner);
    expect(classification.statusCode).toBe(200);
    expect(await readReview(f, rid, owner)).toEqual(before);
    await ok(f, rid, owner, { action: 'SUMMARY', summary: summary.json().data.proposal.summary });
    await candidates(f, rid, owner, c.participantId);
    await ok(f, rid, owner, { action: 'READY', confirmed: true });
    await ok(f, rid, owner, { action: 'SAVE', confirmed: true });
    expect((await readReview(f, rid, owner)).summary).toBe('Questions need review');
    expect((await readReview(f, rid, owner)).state).toBe('SAVED');
  });
  it('WebSocket end-to-end current-state resync never publishes My Space', async () => {
    const id = await createMeetingFor(f, owner, p);
    await start(f, owner, id);
    let box: Inbox | undefined;
    await f.app.injectWS(
      meetingUrl(id) + '/ws',
      { headers: owner.headers },
      {
        onInit: (s) => {
          box = new Inbox(s);
        },
      },
    );
    try {
      expect((await box!.next((f) => f.type === 'STATE')).sequence).toBeDefined();
      box!.send({ type: 'SYNC' });
      const synced = await box!.next((f) => f.event === 'resync');
      expect(JSON.stringify(synced.data)).not.toContain('checkpoint');
      expect((synced.data as { state: string }).state).toBe('LIVE');
    } finally {
      box?.dispose();
    }
  });
});
