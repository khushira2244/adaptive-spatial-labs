import { describe, it, expect } from 'vitest';
import { proposal, op } from './step2.fixture.js';
import { validateFamily } from '../src/modules/architecture/architecture.validation.js';
import { correct } from '../src/modules/architecture/architecture.corrections.js';
import { correctionInput } from '../src/modules/architecture/architecture.input.js';
describe('bounded architecture invariants', () => {
  it('supports multiple documented levels and rejects ancestor cycles', () => {
    const f = proposal(op()),
      child = f.graphs[1]!,
      leaf = { ...structuredClone(child), id: op(), nodes: [{ ...child.nodes[0]!, id: op() }] };
    f.graphs.push(leaf);
    f.innerLinks.push({ id: op(), parentNodeId: child.nodes[0]!.id, childGraphId: leaf.id });
    expect(validateFamily(f).graphs).toHaveLength(3);
    f.innerLinks[0]!.parentNodeId = leaf.nodes[0]!.id;
    expect(() => validateFamily(f)).toThrow('cycle');
  });
  it.each(['graph', 'node', 'connection', 'link', 'provenance'] as const)(
    'rejects duplicate %s identities',
    (kind) => {
      const f = proposal(op()),
        root = f.graphs[0]!;
      if (kind === 'graph') f.graphs[1]!.id = root.id;
      if (kind === 'node') f.graphs[1]!.nodes[0]!.id = root.nodes[0]!.id;
      if (kind === 'connection') root.connections.push(structuredClone(root.connections[0]!));
      if (kind === 'link') f.innerLinks.push(structuredClone(f.innerLinks[0]!));
      if (kind === 'provenance') root.sourceReferenceIds.push(root.sourceReferenceIds[0]!);
      expect(() => validateFamily(f)).toThrow();
    },
  );
  it('rejects two child graphs on one parent node and detached inner graphs', () => {
    const f = proposal(op()),
      copy = structuredClone(f.graphs[1]!);
    copy.id = op();
    copy.nodes[0]!.id = op();
    f.graphs.push(copy);
    expect(() => validateFamily(f)).toThrow('reachable');
    f.innerLinks.push({
      id: op(),
      parentNodeId: f.innerLinks[0]!.parentNodeId,
      childGraphId: copy.id,
    });
    expect(() => validateFamily(f)).toThrow('Duplicate');
  });
  it('bounds total node count across the family, not only each graph', () => {
    const f = proposal(op());
    for (const g of f.graphs)
      while (g.nodes.length < 129) g.nodes.push({ ...g.nodes[0]!, id: op() });
    expect(() => validateFamily(f)).toThrow('bounded');
  });
  it('rejects empty graphs and non-finite positions', () => {
    const f = proposal(op());
    f.graphs[1]!.nodes = [];
    expect(() => validateFamily(f)).toThrow();
    const other = proposal(op());
    other.graphs[0]!.nodes[0]!.position.x = Infinity;
    expect(() => validateFamily(other)).toThrow();
  });
  it('new correction after Undo clears redo and invalid checkpoint cannot be persisted', () => {
    const f = proposal(op()),
      state = { phase: 'REVIEW' as const, undo: [], redo: [] };
    const command = (body: Record<string, unknown>) =>
      correctionInput.parse({ operationId: op(), expectedStamp: 0, ...body });
    const nodeId = f.graphs[0]!.nodes[0]!.id;
    const edited = correct(f, state, command({ action: 'RENAME_NODE', nodeId, name: 'Changed' }));
    const undone = correct(edited.family, edited.recovery, command({ action: 'UNDO' }));
    const fresh = correct(
      undone.family,
      undone.recovery,
      command({ action: 'RENAME_NODE', nodeId, name: 'Different' }),
    );
    expect(fresh.recovery.redo).toHaveLength(0);
    expect(() => correct(fresh.family, fresh.recovery, command({ action: 'REDO' }))).toThrow();
    expect(() =>
      correct(f, state, command({ action: 'CHECKPOINT', checkpoint: { graphId: op() } })),
    ).toThrow();
  });
  it('does not mutate input or erase documented source provenance', () => {
    const f = proposal(op()),
      snapshot = structuredClone(f),
      state = { phase: 'REVIEW' as const, undo: [], redo: [] };
    const next = correct(
      f,
      state,
      correctionInput.parse({
        operationId: op(),
        expectedStamp: 0,
        action: 'CHANGE_NODE_TYPE',
        nodeId: f.graphs[0]!.nodes[0]!.id,
        type: 'API',
      }),
    );
    expect(f).toEqual(snapshot);
    expect(state.undo).toEqual([]);
    expect(next.family.graphs[0]!.sourceReferenceIds).toEqual(
      snapshot.graphs[0]!.sourceReferenceIds,
    );
  });
});
