import type { GraphFamily } from '../architecture/architecture.input.js';
import type { SemanticScope } from './knowledge.input.js';
import { AppError } from '../../shared/errors/app-error.js';
function invalid(message: string): never {
  throw new AppError('VALIDATION_ERROR', message);
}
export function validateSemanticScope(family: GraphFamily, scope: SemanticScope) {
  const graph = family.graphs.find((g) => g.id === scope.architectureGraphRef);
  if (!graph) invalid('Context graph does not belong to this architecture.');
  if (scope.kind === 'WHOLE_ARCHITECTURE' && graph.kind !== 'ROOT')
    invalid('Whole architecture must anchor the root.');
  if (scope.kind === 'NODE' && !graph.nodes.some((n) => n.id === scope.nodeRef))
    invalid('Context node is outside the anchored graph.');
  if (scope.kind === 'CONNECTION' && !graph.connections.some((e) => e.id === scope.connectionRef))
    invalid('Context connection is outside the anchored graph.');
  if (scope.kind === 'INNER_ARCHITECTURE') {
    const link = family.innerLinks.find(
      (l) =>
        l.id === scope.innerLinkRef &&
        l.childGraphId === graph.id &&
        l.parentNodeId === scope.parentNodeRef,
    );
    if (graph.kind !== 'INNER' || !link) invalid('Documented inner link does not match.');
  }
  if (scope.kind === 'LASSO_GROUP') {
    const nodes = new Set(graph.nodes.map((n) => n.id)),
      selected = new Set(scope.selectedNodeRefs);
    if (scope.selectedNodeRefs.some((id) => !nodes.has(id)))
      invalid('Lasso node is outside the anchored graph.');
    const external = new Set<string>();
    for (const id of scope.internalConnectionRefs) {
      const e = graph.connections.find((e) => e.id === id);
      if (!e || !selected.has(e.sourceNodeId) || !selected.has(e.destinationNodeId))
        invalid('Internal connection must have both endpoints selected.');
    }
    for (const id of scope.boundaryConnectionRefs) {
      const e = graph.connections.find((e) => e.id === id);
      if (!e || selected.has(e.sourceNodeId) === selected.has(e.destinationNodeId))
        invalid('Boundary connection must have exactly one selected endpoint.');
      external.add(selected.has(e.sourceNodeId) ? e.destinationNodeId : e.sourceNodeId);
    }
    if (
      external.size !== scope.externalBoundaryEndpointRefs.length ||
      scope.externalBoundaryEndpointRefs.some((id) => !external.has(id))
    )
      invalid('Boundary external endpoints do not match.');
  }
}
