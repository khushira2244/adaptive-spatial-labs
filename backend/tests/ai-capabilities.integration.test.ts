import { authenticatedPrincipal } from './foundation.fixture.js';
import { domainWrites } from '../src/app/domain-writes.js';
import { KnowledgeService } from '../src/modules/knowledge/knowledge.service.js';
import { CommandTransactions } from '../src/shared/database/command-transaction.js';
import { meetingKnowledgePolicy } from '../src/modules/meetings/meeting.context.js';
import { AIContextResolver } from '../src/modules/ai/capabilities/context-resolver.js';
import { AIService } from '../src/modules/ai/ai.service.js';
import { AIExecutor } from '../src/modules/ai/orchestration/ai.executor.js';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { fixture, actors, type Fixture, type Actor } from './fixture.js';
import { prepared, createMeetingFor, start, meetingUrl, view, command } from './meeting.fixture.js';
import { ended, readReview, ok, post, op } from './outcome.fixture.js';
import { FakeAIProvider, nodeVisual, edgeVisual } from './ai.fixture.js';
import { AIError } from '../src/modules/ai/ai.error.js';
describe('AI product capabilities: authorized context, validated previews, no domain writes', () => {
  let f: Fixture,
    owner: Actor,
    editor: Actor,
    outsider: Actor,
    p: Awaited<ReturnType<typeof prepared>>,
    capture: Awaited<ReturnType<typeof ended>>;
  const fake = new FakeAIProvider();
  beforeAll(async () => {
    f = await fixture(fake);
    ({ owner, editor, outsider } = await actors(f));
    p = await prepared(f, owner);
    capture = await ended(f, owner, editor, p);
  });
  afterAll(async () => {
    await f?.close();
  });
  beforeEach(() => fake.reset());
  const ask = (extra: Record<string, unknown> = {}, actor = owner) =>
    post(
      f,
      '/api/v1/ai/context/ask',
      {
        context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope: p.scope },
        question: 'What is the dependency?',
        ...extra,
      },
      actor,
    );
  const ctx = () => JSON.parse(fake.calls[0]!.prompt).context;
  const screenInput = () => ({ presentationId: p.presentationId, screenId: p.screen });
  const scenario = () =>
    post(
      f,
      '/api/v1/ai/scenario/understand',
      {
        ...screenInput(),
        screenType: 'DISCUSSION',
        scenarioGoal: 'Review retries',
        notes: 'Manual goal',
      },
      owner,
    );
  const visual = () =>
    post(
      f,
      '/api/v1/ai/visual-command/translate',
      { ...screenInput(), instruction: 'Highlight payment' },
      owner,
    );
  const frozen = () => post(f, '/api/v1/ai/meetings/' + capture.id + '/summary', {}, owner);
  const classify = () => post(f, '/api/v1/ai/reviews/' + capture.reviewId + '/classify', {}, owner);
  const builder = async () =>
    (await f.app.inject({ url: p.purl, headers: owner.headers })).json().data;
  const summaryOutput = () => ({
    summary: 'Structured captured questions only',
    themes: ['Retry policy'],
    unresolvedTopics: [],
    potentialDecisions: [],
    potentialActions: [],
    references: [],
    assumptions: [],
    uncertainties: ['Verbal discussion was not captured'],
  });
  it('authorized context gives proposal only with exact basis and safe metadata', async () => {
    const r = await ask();
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().data).toMatchObject({
      status: 'PROPOSAL',
      humanConfirmationRequired: true,
      promptVersion: 'ask.v1',
      metadata: { provider: 'fake', model: 'test' },
    });
    expect(ctx().PRIMARY.nodes).toHaveLength(2);
    expect(JSON.stringify(ctx())).not.toContain('sourceReferenceIds');
    expect(JSON.stringify(ctx())).not.toContain('Ledger');
  });
  it('outsider cannot resolve context or trigger paid provider work', async () => {
    expect((await ask({}, outsider)).statusCode).toBe(404);
    expect(fake.calls).toHaveLength(0);
  });
  it('authentication and strict inputs reject role/prompt overposting', async () => {
    const noAuth = await f.app.inject({
      method: 'POST',
      url: '/api/v1/ai/context/ask',
      payload: {
        context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope: p.scope },
        question: 'Hi',
      },
    });
    expect(noAuth.statusCode).toBe(401);
    expect((await ask({ role: 'OWNER' })).statusCode).toBe(400);
  });
  it('lasso preserves PRIMARY and BOUNDARY; expansion must be explicit', async () => {
    const g = p.family.graphs[0]!,
      one = g.nodes[0]!.id,
      two = g.nodes[1]!.id,
      e = g.connections[0]!.id;
    const scope = {
      ...p.scope,
      kind: 'LASSO_GROUP',
      selectedNodeRefs: [one],
      internalConnectionRefs: [],
      boundaryConnectionRefs: [e],
      externalBoundaryEndpointRefs: [two],
    };
    expect(
      (await ask({ context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope } })).statusCode,
    ).toBe(200);
    expect(ctx().PRIMARY.nodes.map((n: { id: string }) => n.id)).toEqual([one]);
    expect(ctx().BOUNDARY.endpoints.map((n: { id: string }) => n.id)).toEqual([two]);
    expect(ctx().EXPANDED).toEqual([]);
    fake.reset();
    expect(
      (
        await ask({
          context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope, expandBoundary: true },
        })
      ).statusCode,
    ).toBe(200);
    expect(ctx().EXPANDED).toHaveLength(1);
  });
  it('includes only deliberately selected own Knowledge; rejects other participant private ID', async () => {
    const a = await post(
      f,
      '/api/v1/knowledge',
      {
        operationId: op(),
        category: 'NOTE',
        title: 'Own selected',
        body: 'Authorized selected text',
      },
      owner,
    );
    expect(a.statusCode, a.body).toBe(200);
    expect(
      (
        await ask({
          context: {
            kind: 'ARCHITECTURE',
            projectId: p.projectId,
            scope: p.scope,
            knowledgeIds: [a.json().data.id],
          },
        })
      ).statusCode,
    ).toBe(200);
    expect(ctx().knowledge[0]).toMatchObject({
      key: 'knowledge:0',
      body: 'Authorized selected text',
    });
    expect(fake.calls[0]!.prompt).not.toContain(a.json().data.id);
    fake.reset();
    expect(
      (
        await ask({
          context: {
            kind: 'ARCHITECTURE',
            projectId: p.projectId,
            scope: p.scope,
            knowledgeIds: [capture.origin],
          },
        })
      ).statusCode,
    ).toBe(404);
    expect(fake.calls).toHaveLength(0);
  });
  it('SourceReference metadata requires same Project policy; no raw body or arbitrary fetch', async () => {
    expect(
      (
        await ask({
          context: {
            kind: 'ARCHITECTURE',
            projectId: p.projectId,
            scope: p.scope,
            sourceReferenceIds: [p.referenceId],
          },
        })
      ).statusCode,
    ).toBe(200);
    expect(ctx().sources[0]).toMatchObject({
      key: 'source:' + p.referenceId,
      revision: 'revision-1',
      locator: { kind: 'DOCUMENT', page: 1 },
    });
    fake.reset();
    expect(
      (
        await ask({
          context: {
            kind: 'ARCHITECTURE',
            projectId: p.projectId,
            scope: p.scope,
            sourceReferenceIds: [op()],
          },
        })
      ).statusCode,
    ).toBe(404);
    expect(fake.calls).toHaveLength(0);
  });
  it('invented semantic references and prompt-injection output fail schema/domain validation', async () => {
    fake.output = {
      answer: 'Claimed saved!',
      references: [op()],
      assumptions: [],
      uncertainties: [],
      followUps: [],
    };
    expect((await ask()).json().error.code).toBe('AI_OUTPUT_INVALID');
    fake.output = {
      answer: 'x',
      references: [],
      assumptions: [],
      uncertainties: [],
      followUps: [],
      mutateArchitecture: true,
    };
    expect((await ask()).json().error.code).toBe('AI_OUTPUT_INVALID');
  });
  it('discussion suggestions are bounded and never create KnowledgeItems', async () => {
    const before = (await f.pool.query('select count(*) from knowledge_items')).rows[0].count;
    fake.output = {
      suggestions: [
        {
          question: 'Retry owner?',
          why: 'Failure handling',
          category: 'RISK',
          references: [p.family.graphs[0]!.nodes[0]!.id],
          uncertainty: 'Not documented',
        },
      ],
    };
    const r = await post(
      f,
      '/api/v1/ai/discussion-points',
      { context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope: p.scope } },
      owner,
    );
    expect(r.statusCode, r.body).toBe(200);
    expect((await f.pool.query('select count(*) from knowledge_items')).rows[0].count).toBe(before);
    fake.output = {
      suggestions: Array(9).fill((fake.output as { suggestions: unknown[] }).suggestions[0]),
    };
    expect(
      (
        await post(
          f,
          '/api/v1/ai/discussion-points',
          { context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope: p.scope } },
          owner,
        )
      ).json().error.code,
    ).toBe('AI_OUTPUT_INVALID');
  });
  it('scenario remains a proposal: does not accept understanding, confirm or alter screen', async () => {
    const before = await builder();
    fake.output = {
      interpretedScenario: 'Retry review',
      affectedComponents: [p.family.graphs[0]!.nodes[0]!.id],
      expectedBehavior: ['Document retries'],
      interpretation: 'DISCUSSION',
      assumptions: [],
      uncertainties: ['Owner unknown'],
      references: [],
    };
    const r = await scenario();
    expect(r.statusCode, r.body).toBe(200);
    expect(await builder()).toEqual(before);
  });
  it('invented scenario components are rejected', async () => {
    fake.output = {
      interpretedScenario: 'Unknown',
      affectedComponents: [op()],
      expectedBehavior: [],
      interpretation: 'CUSTOM',
      assumptions: [],
      uncertainties: [],
      references: [],
    };
    expect((await scenario()).json().error.code).toBe('AI_OUTPUT_INVALID');
  });
  it('protected Main cannot request authoring preview', async () => {
    fake.output = {
      operations: [{ action: 'RESET_VISUALS' }],
      explanation: 'Reset',
      assumptions: [],
      uncertainties: [],
    };
    expect(
      (
        await post(
          f,
          '/api/v1/ai/visual-command/translate',
          { presentationId: p.presentationId, screenId: p.main, instruction: 'Change Main' },
          owner,
        )
      ).statusCode,
    ).toBe(409);
    expect(fake.calls).toHaveLength(0);
  });
  it('visual commands use existing vocabulary and validate preview without applying', async () => {
    const before = await builder(),
      nodeId = p.family.graphs[0]!.nodes[0]!.id;
    fake.output = {
      operations: [
        {
          action: 'NODE_VISUAL',
          nodeId,
          visual: { ...nodeVisual, state: 'FAILURE', marker: 'WARNING' },
        },
      ],
      explanation: 'Suggested failure view',
      assumptions: [],
      uncertainties: [],
    };
    const r = await visual();
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().data.preview.draft.nodeOverrides[0]).toMatchObject({
      nodeId,
      visual: { state: 'FAILURE' },
    });
    expect(await builder()).toEqual(before);
  });
  it('visual invented targets and arbitrary renderer properties fail closed', async () => {
    fake.output = {
      operations: [{ action: 'NODE_VISUAL', nodeId: op(), visual: nodeVisual }],
      explanation: 'Test',
      assumptions: [],
      uncertainties: [],
    };
    expect((await visual()).json().error.code).toBe('AI_OUTPUT_INVALID');
    fake.output = {
      operations: [
        {
          action: 'NODE_VISUAL',
          nodeId: p.family.graphs[0]!.nodes[0]!.id,
          visual: { ...nodeVisual, color: 'RAINBOW' },
        },
      ],
      explanation: 'Test',
      assumptions: [],
      uncertainties: [],
    };
    expect((await visual()).json().error.code).toBe('AI_OUTPUT_INVALID');
  });
  it('scenario-only overlay and connection preview do not create canonical relationships', async () => {
    const g = p.family.graphs[0]!,
      before = (await f.pool.query('select count(*) from architecture_connections')).rows;
    fake.output = {
      operations: [
        {
          action: 'ADD_OVERLAY',
          sourceNodeId: g.nodes[0]!.id,
          destinationNodeId: g.nodes[1]!.id,
          label: 'Hypothetical',
          visual: edgeVisual,
        },
        {
          action: 'CONNECTION_VISUAL',
          connectionId: g.connections[0]!.id,
          visual: { ...edgeVisual, state: 'BROKEN' },
        },
      ],
      explanation: 'Preview only',
      assumptions: ['Hypothetical failure'],
      uncertainties: [],
    };
    expect((await visual()).statusCode).toBe(200);
    expect((await f.pool.query('select count(*) from architecture_connections')).rows).toEqual(
      before,
    );
    expect(
      (await builder()).screens.find((s: { id: string }) => s.id === p.screen).overlays,
    ).toEqual([]);
  });
  it('frozen meeting summary excludes unshared/withdrawn/private origins and checkpoints', async () => {
    fake.output = summaryOutput();
    const before = await readReview(f, capture.reviewId, owner);
    const r = await frozen();
    expect(r.statusCode, r.body).toBe(200);
    const text = fake.calls[0]!.prompt;
    for (const secret of [
      capture.origin,
      capture.hidden,
      capture.withdrawn,
      'Unshared secret',
      'Withdrawn secret',
      'checkpoint',
      'transcript',
      'originId',
      'tokenDigest',
    ])
      expect(text).not.toContain(secret);
    expect(ctx().entries).toHaveLength(3);
    expect(await readReview(f, capture.reviewId, owner)).toEqual(before);
  });
  it('later private edits cannot affect frozen summary package', async () => {
    fake.output = summaryOutput();
    expect((await frozen()).statusCode).toBe(200);
    const before = fake.calls[0]!.prompt;
    const edit = await f.app.inject({
      method: 'PUT',
      url: meetingUrl(capture.id) + '/private/items/' + capture.origin,
      headers: editor.headers,
      payload: {
        expectedStamp: 0,
        category: 'NOTE',
        title: 'Private future title',
        body: 'Private future body',
      },
    });
    expect(edit.statusCode, edit.body).toBe(200);
    fake.reset();
    fake.output = summaryOutput();
    expect((await frozen()).statusCode).toBe(200);
    expect(fake.calls[0]!.prompt).toBe(before);
  });
  it('summary cannot run on LIVE Meeting and participant cannot finalize review context', async () => {
    const id = await createMeetingFor(f, owner, p);
    await start(f, owner, id);
    fake.output = summaryOutput();
    expect((await post(f, '/api/v1/ai/meetings/' + id + '/summary', {}, owner)).statusCode).toBe(
      409,
    );
    expect(
      (await post(f, '/api/v1/ai/meetings/' + capture.id + '/summary', {}, editor)).statusCode,
    ).toBe(404);
    expect(fake.calls).toHaveLength(0);
  });
  it('Meeting context ask uses only admitted current/frozen safe content', async () => {
    expect(
      (await ask({ context: { kind: 'MEETING', meetingId: capture.id } }, editor)).statusCode,
    ).toBe(200);
    expect(ctx().captureId).toBe(capture.captureId);
    expect(fake.calls[0]!.prompt).not.toContain('Unshared secret');
  });
  it('invalid frozen evidence keys are rejected', async () => {
    fake.output = { ...summaryOutput(), references: ['publication:' + op()] };
    expect((await frozen()).json().error.code).toBe('AI_OUTPUT_INVALID');
  });
  it('outcome classification is suggestion only with no ReviewItem/Decision/Action mutation', async () => {
    const before = await readReview(f, capture.reviewId, owner);
    fake.output = {
      suggestions: [
        {
          itemId: before.items[0].id,
          classification: 'DISCUSSED',
          rationale: 'Human should verify discussion',
          references: [before.source.entries[0].key],
          decision: null,
          action: null,
        },
      ],
      assumptions: [],
      uncertainties: ['No transcript'],
    };
    const r = await classify();
    expect(r.statusCode, r.body).toBe(200);
    expect(await readReview(f, capture.reviewId, owner)).toEqual(before);
  });
  it('invalid review transitions, vocabularies and invented items cannot become proposals', async () => {
    const r = await readReview(f, capture.reviewId, owner),
      s = {
        itemId: r.items[0].id,
        classification: 'DECISION',
        rationale: 'Unsupported',
        references: [],
        decision: null,
        action: null,
      };
    fake.output = { suggestions: [s], assumptions: [], uncertainties: [] };
    expect((await classify()).json().error.code).toBe('AI_OUTPUT_INVALID');
    fake.output = {
      suggestions: [{ ...s, itemId: op(), classification: 'DISCUSSED' }],
      assumptions: [],
      uncertainties: [],
    };
    expect((await classify()).json().error.code).toBe('AI_OUTPUT_INVALID');
    fake.output = {
      suggestions: [{ ...s, classification: 'AUTO_ACCEPTED' }],
      assumptions: [],
      uncertainties: [],
    };
    expect((await classify()).json().error.code).toBe('AI_OUTPUT_INVALID');
  });
  it('Decision/Action candidates remain unaccepted after valid suggestions', async () => {
    let r = await readReview(f, capture.reviewId, owner);
    await ok(f, capture.reviewId, owner, {
      action: 'CLASSIFY',
      itemId: r.items[0].id,
      classification: 'DISCUSSED',
    });
    r = await readReview(f, capture.reviewId, owner);
    fake.output = {
      suggestions: [
        {
          itemId: r.items[0].id,
          classification: 'DECISION',
          rationale: 'Review possible decision',
          references: [],
          decision: {
            title: 'Candidate only',
            description: 'Consider retry ownership',
            references: [],
          },
          action: null,
        },
      ],
      assumptions: [],
      uncertainties: ['Owner acceptance required'],
    };
    expect((await classify()).statusCode).toBe(200);
    const after = await readReview(f, capture.reviewId, owner);
    expect(after.decisions).toEqual([]);
    expect(after.actions).toEqual([]);
    expect(after.items[0].classification).toBe('DISCUSSED');
  });
  it('provider unavailable/malformed output leaves deterministic domains usable', async () => {
    const before = await readReview(f, capture.reviewId, owner);
    fake.failure = new AIError('AI_UNAVAILABLE');
    expect((await ask()).json().error.code).toBe('AI_UNAVAILABLE');
    fake.failure = undefined;
    fake.raw = 'not JSON';
    expect((await ask()).json().error.code).toBe('AI_OUTPUT_INVALID');
    expect(await readReview(f, capture.reviewId, owner)).toEqual(before);
    expect((await f.app.inject({ url: p.purl, headers: owner.headers })).statusCode).toBe(200);
    await ok(f, capture.reviewId, owner, {
      action: 'SUMMARY',
      summary: 'Manual workflow still works',
    });
  });
  it('reauthorizes and rejects stale owner context after provider wait', async () => {
    const note = await post(
        f,
        '/api/v1/knowledge',
        { operationId: op(), category: 'NOTE', title: 'Initial', body: 'Initial body' },
        owner,
      ),
      id = note.json().data.id;
    fake.before = async () => {
      const update = await f.app.inject({
        method: 'PUT',
        url: '/api/v1/knowledge/' + id,
        headers: owner.headers,
        payload: {
          expectedStamp: 0,
          category: 'NOTE',
          title: 'Changed while AI pending',
          body: 'Fresh private data',
        },
      });
      expect(update.statusCode).toBe(200);
    };
    const r = await ask({
      context: { kind: 'ARCHITECTURE', projectId: p.projectId, scope: p.scope, knowledgeIds: [id] },
    });
    expect(r.statusCode, r.body).toBe(409);
    expect(r.json().error.code).toBe('STALE_CHANGE_STAMP');
  });
  it('rejects generic chatbot route and overlong request before any model call', async () => {
    expect((await post(f, '/api/v1/ai/chat', { prompt: 'Anything' }, owner)).statusCode).toBe(404);
    expect((await ask({ question: 'x'.repeat(2001) })).statusCode).toBe(400);
    expect(fake.calls).toHaveLength(0);
  });

  it('revocation during provider wait prevents disclosure of the generated proposal', async () => {
    await f.pool.query(
      'insert into project_editors(project_id,user_id,added_by_user_id) values($1,$2,$3)',
      [p.projectId, editor.id, owner.id],
    );
    fake.before = async () => {
      await f.pool.query('delete from project_editors where project_id=$1 and user_id=$2', [
        p.projectId,
        editor.id,
      ]);
    };
    try {
      const response = await ask({}, editor);
      expect(response.statusCode, response.body).toBe(404);
      expect(response.body).not.toContain('Grounded answer');
    } finally {
      await f.pool.query('delete from project_editors where project_id=$1 and user_id=$2', [
        p.projectId,
        editor.id,
      ]);
    }
  });
  it('timeout leaves review and architecture unmodified', async () => {
    const before = await readReview(f, capture.reviewId, owner);
    fake.before = async () => {
      await new Promise(() => {});
    };
    const principal = await authenticatedPrincipal(f, owner),
      writes = domainWrites(f.db, f.config),
      knowledge = new KnowledgeService(
        f.db,
        writes,
        new CommandTransactions(f.db),
        meetingKnowledgePolicy,
      );
    const service = new AIService(
      f.db,
      new AIContextResolver(f.db, knowledge),
      new AIExecutor(fake, 15),
    );
    await expect(
      service.ask(principal, {
        context: {
          kind: 'ARCHITECTURE',
          projectId: p.projectId,
          scope: p.scope,
          knowledgeIds: [],
          sourceReferenceIds: [],
          expandBoundary: false,
        },
        question: 'Question',
        reasoning: false,
      }),
    ).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    expect(await readReview(f, capture.reviewId, owner)).toEqual(before);
    expect((await f.app.inject({ url: p.purl, headers: owner.headers })).statusCode).toBe(200);
  });
});
