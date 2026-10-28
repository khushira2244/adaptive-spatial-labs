import { randomUUID } from 'node:crypto';
import type { Fixture, Actor } from './fixture.js';
import { createProject } from './fixture.js';
import { familySchema, type GraphFamily } from '../src/modules/architecture/architecture.input.js';
export const op = () => randomUUID();
export async function sourceContext(f: Fixture, owner: Actor, extra: Record<string, unknown> = {}) {
  const project = await createProject(f, owner, extra);
  const base = '/api/v1/projects/' + project.id;
  const sourceRes = await f.app.inject({
    method: 'POST',
    url: base + '/sources',
    headers: owner.headers,
    payload: { sourceType: 'FILE', name: 'Architecture document' },
  });
  if (sourceRes.statusCode !== 201) throw new Error(sourceRes.body);
  const sourceId = sourceRes.json().data.id as string;
  const source = base + '/sources/' + sourceId;
  const reference = await f.app.inject({
    method: 'POST',
    url: source + '/references',
    headers: owner.headers,
    payload: { operationId: op(), revision: 'revision-1', locator: { kind: 'DOCUMENT', page: 1 } },
  });
  if (reference.statusCode !== 200) throw new Error(reference.body);
  return {
    projectId: project.id,
    sourceId,
    source,
    base,
    referenceId: reference.json().data.id as string,
  };
}
export function proposal(referenceId: string, inner = true): GraphFamily {
  const root = randomUUID(),
    child = randomUUID(),
    one = randomUUID(),
    two = randomUUID(),
    nested = randomUUID();
  return familySchema.parse({
    rootGraphId: root,
    graphs: [
      {
        id: root,
        kind: 'ROOT',
        name: 'Payments',
        sourceReferenceIds: [referenceId],
        nodes: [
          { id: one, name: 'Payment', type: 'SERVICE', position: { x: 0, y: 0 } },
          { id: two, name: 'Database', type: 'DATABASE', position: { x: 1, y: 0 } },
        ],
        connections: [
          {
            id: randomUUID(),
            sourceNodeId: one,
            destinationNodeId: two,
            sourceReferenceIds: [referenceId],
          },
        ],
      },
      ...(inner
        ? [
            {
              id: child,
              kind: 'INNER',
              name: 'Payment internals',
              sourceReferenceIds: [referenceId],
              nodes: [{ id: nested, name: 'Ledger', type: 'SERVICE', position: { x: 0, y: 0 } }],
              connections: [],
            },
          ]
        : []),
    ],
    innerLinks: inner ? [{ id: randomUUID(), parentNodeId: one, childGraphId: child }] : [],
  });
}
export async function architectureContext(
  f: Fixture,
  owner: Actor,
  extra: Record<string, unknown> = {},
) {
  const context = await sourceContext(f, owner, extra);
  const family = proposal(context.referenceId);
  const url = context.base + '/architecture';
  const result = await f.app.inject({
    method: 'POST',
    url,
    headers: owner.headers,
    payload: { operationId: op(), proposal: family },
  });
  if (result.statusCode !== 200) throw new Error(result.body);
  return { ...context, url, family, architectureId: result.json().data.architectureId as string };
}
