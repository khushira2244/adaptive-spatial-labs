import type { GraphFamily } from '../../architecture/architecture.input.js';
import type { SemanticScope } from '../../knowledge/knowledge.input.js';
import { validateSemanticScope } from '../../knowledge/knowledge.scope.js';
import { AIError } from '../ai.error.js';
export type ContextPackage = {
  payload: Record<string, unknown>;
  references: string[];
  nodeIds: string[];
  connectionIds: string[];
  basis: Record<string, unknown>;
};
export function architecturePackage(
  family: GraphFamily,
  scope: SemanticScope,
  expanded = false,
): ContextPackage {
  validateSemanticScope(family, scope);
  const graph = family.graphs.find((g) => g.id === scope.architectureGraphRef)!;
  const primaryIds = new Set(
    scope.kind === 'LASSO_GROUP'
      ? scope.selectedNodeRefs
      : scope.kind === 'NODE'
        ? [scope.nodeRef]
        : scope.kind === 'CONNECTION'
          ? graph.connections
              .filter((e) => e.id === scope.connectionRef)
              .flatMap((e) => [e.sourceNodeId, e.destinationNodeId])
          : graph.nodes.map((n) => n.id),
  );
  const primary = graph.nodes
    .filter((n) => primaryIds.has(n.id))
    .map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      description: n.description,
      technology: n.technology,
    }));
  const internal = graph.connections.filter(
    (e) => primaryIds.has(e.sourceNodeId) && primaryIds.has(e.destinationNodeId),
  );
  const crossing = graph.connections.filter(
    (e) => primaryIds.has(e.sourceNodeId) !== primaryIds.has(e.destinationNodeId),
  );
  const externalIds = new Set(
    crossing
      .flatMap((e) => [e.sourceNodeId, e.destinationNodeId])
      .filter((id) => !primaryIds.has(id)),
  );
  const edge = (e: (typeof internal)[number]) => ({
    id: e.id,
    sourceNodeId: e.sourceNodeId,
    destinationNodeId: e.destinationNodeId,
    relationship: e.relationship,
    label: e.label,
  });
  const boundary = graph.nodes
    .filter((n) => externalIds.has(n.id))
    .map((n) => ({ id: n.id, name: n.name, type: n.type }));
  const extra = expanded
    ? graph.nodes
        .filter((n) => externalIds.has(n.id))
        .map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
          description: n.description,
          technology: n.technology,
        }))
    : [];
  return {
    payload: {
      scope,
      PRIMARY: { nodes: primary, connections: internal.map(edge) },
      BOUNDARY: { endpoints: boundary, connections: crossing.map(edge) },
      EXPANDED: extra,
    },
    references: [
      ...primaryIds,
      ...externalIds,
      ...internal.map((e) => e.id),
      ...crossing.map((e) => e.id),
    ],
    nodeIds: [...primaryIds],
    connectionIds: internal.map((e) => e.id),
    basis: { scope },
  };
}
export function boundPackage(p: ContextPackage) {
  if (Buffer.byteLength(JSON.stringify(p.payload), 'utf8') > 131072)
    throw new AIError('AI_CONTEXT_TOO_LARGE');
  return p;
}
