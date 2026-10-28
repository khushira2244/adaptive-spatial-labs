import { requireLifecycle } from '../../shared/auth/authorization.js';
import {
  type GraphFamily,
  type CorrectionState,
  type CorrectionInput,
} from './architecture.input.js';
import { invalid, validateFamily } from './architecture.validation.js';
const bound = (history: GraphFamily[]) => history.slice(-8);
export function correct(family: GraphFamily, state: CorrectionState, input: CorrectionInput) {
  let next = structuredClone(family);
  const recovery = structuredClone(state);
  requireLifecycle(state.phase !== 'CLOSED');
  if (input.action === 'UNDO') {
    const previous = recovery.undo.pop();
    requireLifecycle(!!previous);
    recovery.redo = bound([...recovery.redo, next]);
    next = previous!;
  } else if (input.action === 'REDO') {
    const future = recovery.redo.pop();
    requireLifecycle(!!future);
    recovery.undo = bound([...recovery.undo, next]);
    next = future!;
  } else if (input.action === 'DONE') {
    recovery.phase = 'REVIEW';
    delete recovery.checkpoint;
  } else if (input.action === 'CHECKPOINT') {
    const graph = next.graphs.find((g) => g.id === input.checkpoint.graphId);
    if (
      !graph ||
      (input.checkpoint.selectedNodeId &&
        !graph.nodes.some((n) => n.id === input.checkpoint.selectedNodeId))
    )
      invalid('Invalid correction checkpoint.');
    recovery.checkpoint = {
      graphId: input.checkpoint.graphId,
      ...(input.checkpoint.selectedNodeId
        ? { selectedNodeId: input.checkpoint.selectedNodeId }
        : {}),
    };
    recovery.phase = 'CORRECTION';
  } else {
    recovery.undo = bound([...recovery.undo, structuredClone(family)]);
    recovery.redo = [];
    recovery.phase = 'CORRECTION';
    const node =
      'nodeId' in input
        ? next.graphs.flatMap((g) => g.nodes).find((n) => n.id === input.nodeId)
        : undefined;
    if ('nodeId' in input && !node) invalid('Node not found in this architecture.');
    switch (input.action) {
      case 'RENAME_NODE':
        node!.name = input.name;
        break;
      case 'CHANGE_NODE_TYPE':
        node!.type = input.type;
        break;
      case 'MOVE_NODE':
        node!.position = input.position;
        break;
      case 'ADD_NODE': {
        const g = next.graphs.find((g) => g.id === input.graphId);
        if (!g) invalid('Graph not found.');
        g.nodes.push(input.node);
        break;
      }
      case 'DELETE_NODE':
        if (next.innerLinks.some((l) => l.parentNodeId === input.nodeId))
          invalid('Reparent imported depth before deleting its parent.');
        for (const g of next.graphs) {
          g.nodes = g.nodes.filter((n) => n.id !== input.nodeId);
          g.connections = g.connections.filter(
            (e) => e.sourceNodeId !== input.nodeId && e.destinationNodeId !== input.nodeId,
          );
        }
        break;
      case 'ADD_CONNECTION': {
        const g = next.graphs.find((g) => g.id === input.graphId);
        if (!g) invalid('Graph not found.');
        g.connections.push(input.connection);
        break;
      }
      case 'DELETE_CONNECTION':
        if (!next.graphs.some((g) => g.connections.some((e) => e.id === input.connectionId)))
          invalid('Connection not found.');
        for (const g of next.graphs)
          g.connections = g.connections.filter((e) => e.id !== input.connectionId);
        break;
      case 'REPARENT_INNER': {
        const link = next.innerLinks.find((l) => l.childGraphId === input.childGraphId);
        if (!link || link.parentNodeId !== input.previousParentNodeId)
          invalid('Imported inner link does not match.');
        link.parentNodeId = input.parentNodeId;
        break;
      }
    }
    delete recovery.checkpoint;
  }
  return { family: validateFamily(next), recovery };
}
