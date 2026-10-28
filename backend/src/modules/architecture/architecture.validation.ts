import { AppError } from '../../shared/errors/app-error.js';
import { familySchema, type GraphFamily } from './architecture.input.js';
export function invalid(message: string): never {
  throw new AppError('VALIDATION_ERROR', message);
}
export function validateFamily(input: unknown): GraphFamily {
  const f = familySchema.parse(input);
  const unique = (ids: string[]) => {
    if (new Set(ids).size !== ids.length) invalid('Duplicate identity.');
  };
  unique(f.graphs.map((g) => g.id));
  unique(f.graphs.flatMap((g) => g.nodes.map((n) => n.id)));
  unique(f.graphs.flatMap((g) => g.connections.map((e) => e.id)));
  unique(f.innerLinks.map((l) => l.id));
  if (
    f.graphs.flatMap((g) => g.nodes).length > 256 ||
    f.graphs.flatMap((g) => g.connections).length > 512
  )
    invalid('Architecture exceeds the bounded import size.');
  const roots = f.graphs.filter((g) => g.kind === 'ROOT');
  if (roots.length !== 1 || roots[0]!.id !== f.rootGraphId)
    invalid('Exactly one root is required.');
  for (const g of f.graphs) {
    if (!g.sourceReferenceIds.length) invalid('Every imported graph requires source provenance.');
    const nodes = new Set(g.nodes.map((n) => n.id));
    for (const e of g.connections)
      if (!nodes.has(e.sourceNodeId) || !nodes.has(e.destinationNodeId))
        invalid('Connection endpoints must belong to the same graph.');
    for (const ids of [
      g.sourceReferenceIds,
      ...g.nodes.map((n) => n.sourceReferenceIds),
      ...g.connections.map((e) => e.sourceReferenceIds),
    ])
      unique(ids);
  }
  unique(f.innerLinks.map((l) => l.parentNodeId));
  unique(f.innerLinks.map((l) => l.childGraphId));
  const parents = new Map<string, string>();
  for (const l of f.innerLinks) {
    const parent = f.graphs.find((g) => g.nodes.some((n) => n.id === l.parentNodeId));
    const child = f.graphs.find((g) => g.id === l.childGraphId);
    if (!parent || !child || child.kind !== 'INNER') invalid('Invalid inner graph owner.');
    parents.set(l.childGraphId, parent.id);
  }
  for (const g of f.graphs) {
    const visited = new Set<string>();
    let current = g.id;
    while (current !== f.rootGraphId) {
      if (visited.has(current)) invalid('Inner architecture cycle.');
      visited.add(current);
      const parent = parents.get(current);
      if (!parent) invalid('Every inner graph must be reachable from the root.');
      current = parent;
    }
  }
  return f;
}
export function provenanceIds(f: GraphFamily) {
  return [
    ...new Set(
      f.graphs.flatMap((g) => [
        ...g.sourceReferenceIds,
        ...g.nodes.flatMap((n) => n.sourceReferenceIds),
        ...g.connections.flatMap((e) => e.sourceReferenceIds),
      ]),
    ),
  ];
}
