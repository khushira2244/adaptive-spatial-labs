import { and, eq, inArray, asc } from 'drizzle-orm';
import type { Executor } from '../../shared/database/client.js';
import * as s from './architecture.schema.js';
import type { GraphFamily } from './architecture.input.js';
export class ArchitectureRepository {
  constructor(private db: Executor) {}
  async get(projectId: string, lock = false) {
    const query = this.db
      .select()
      .from(s.architectures)
      .where(eq(s.architectures.projectId, projectId));
    const [row] = lock ? await query.for('update') : await query;
    return row;
  }
  async load(architectureId: string): Promise<GraphFamily> {
    const graphs = await this.db
      .select()
      .from(s.architectureGraphs)
      .where(eq(s.architectureGraphs.architectureId, architectureId))
      .orderBy(asc(s.architectureGraphs.id));
    const ids = graphs.map((g) => g.id);
    const nodes = await this.db
      .select()
      .from(s.architectureNodes)
      .where(inArray(s.architectureNodes.graphId, ids))
      .orderBy(asc(s.architectureNodes.id));
    const edges = await this.db
      .select()
      .from(s.architectureConnections)
      .where(inArray(s.architectureConnections.graphId, ids))
      .orderBy(asc(s.architectureConnections.id));
    const gp = await this.db
      .select()
      .from(s.graphProvenance)
      .where(inArray(s.graphProvenance.graphId, ids));
    const np = await this.db
      .select()
      .from(s.nodeProvenance)
      .where(inArray(s.nodeProvenance.graphId, ids));
    const ep = await this.db
      .select()
      .from(s.connectionProvenance)
      .where(inArray(s.connectionProvenance.graphId, ids));
    const links = await this.db
      .select()
      .from(s.innerArchitectureReferences)
      .where(eq(s.innerArchitectureReferences.architectureId, architectureId))
      .orderBy(asc(s.innerArchitectureReferences.id));
    return {
      rootGraphId: graphs.find((g) => g.kind === 'ROOT')!.id,
      graphs: graphs.map((g) => ({
        id: g.id,
        kind: g.kind,
        name: g.name,
        sourceReferenceIds: gp
          .filter((p) => p.graphId === g.id)
          .map((p) => p.referenceId)
          .sort(),
        nodes: nodes
          .filter((n) => n.graphId === g.id)
          .map(({ graphId: _, ...n }) => ({
            ...n,
            sourceReferenceIds: np
              .filter((p) => p.nodeId === n.id)
              .map((p) => p.referenceId)
              .sort(),
          })),
        connections: edges
          .filter((e) => e.graphId === g.id)
          .map(({ graphId: _, relationship, ...e }) => ({
            ...e,
            relationship:
              relationship as GraphFamily['graphs'][number]['connections'][number]['relationship'],
            sourceReferenceIds: ep
              .filter((p) => p.connectionId === e.id)
              .map((p) => p.referenceId)
              .sort(),
          })),
      })),
      innerLinks: links.map((l) => ({
        id: l.id,
        parentNodeId: l.parentNodeId,
        childGraphId: l.childGraphId,
      })),
    };
  }
  async insert(architectureId: string, family: GraphFamily) {
    await this.db
      .insert(s.architectureGraphs)
      .values(
        family.graphs.map((g) => ({
          id: g.id,
          architectureId,
          kind: g.kind,
          name: g.name,
          state: 'CANDIDATE' as const,
        })),
      );
    for (const g of family.graphs) {
      await this.db
        .insert(s.graphProvenance)
        .values(g.sourceReferenceIds.map((referenceId) => ({ graphId: g.id, referenceId })));
    }
    await this.save(
      architectureId,
      {
        rootGraphId: family.rootGraphId,
        graphs: family.graphs.map((g) => ({ ...g, nodes: [], connections: [] })),
        innerLinks: [],
      },
      family,
    );
  }
  async save(architectureId: string, previous: GraphFamily, next: GraphFamily) {
    const nextNodes = new Set(next.graphs.flatMap((g) => g.nodes.map((n) => n.id)));
    const nextEdges = new Set(next.graphs.flatMap((g) => g.connections.map((e) => e.id)));
    // Remove references before their endpoint owners; retained objects are UPDATEd in place.
    for (const l of previous.innerLinks) {
      const retained = next.innerLinks.find((n) => n.id === l.id);
      if (!retained || retained.parentNodeId !== l.parentNodeId)
        await this.db
          .delete(s.innerArchitectureReferences)
          .where(eq(s.innerArchitectureReferences.id, l.id));
    }
    for (const g of previous.graphs) {
      for (const e of g.connections)
        if (!nextEdges.has(e.id)) {
          await this.db
            .delete(s.connectionProvenance)
            .where(eq(s.connectionProvenance.connectionId, e.id));
          await this.db
            .delete(s.architectureConnections)
            .where(eq(s.architectureConnections.id, e.id));
        }
      for (const n of g.nodes)
        if (!nextNodes.has(n.id)) {
          await this.db.delete(s.nodeProvenance).where(eq(s.nodeProvenance.nodeId, n.id));
          await this.db.delete(s.architectureNodes).where(eq(s.architectureNodes.id, n.id));
        }
    }
    for (const g of next.graphs) {
      const before = previous.graphs.find((p) => p.id === g.id);
      for (const n of g.nodes) {
        const { sourceReferenceIds, ...fields } = n;
        if (before?.nodes.some((p) => p.id === n.id))
          await this.db
            .update(s.architectureNodes)
            .set(fields)
            .where(and(eq(s.architectureNodes.id, n.id), eq(s.architectureNodes.graphId, g.id)));
        else {
          await this.db.insert(s.architectureNodes).values({ ...fields, graphId: g.id });
          if (sourceReferenceIds.length)
            await this.db
              .insert(s.nodeProvenance)
              .values(
                sourceReferenceIds.map((referenceId) => ({
                  nodeId: n.id,
                  graphId: g.id,
                  referenceId,
                })),
              );
        }
      }
      for (const e of g.connections) {
        const { sourceReferenceIds, ...fields } = e;
        if (before?.connections.some((p) => p.id === e.id))
          await this.db
            .update(s.architectureConnections)
            .set(fields)
            .where(
              and(
                eq(s.architectureConnections.id, e.id),
                eq(s.architectureConnections.graphId, g.id),
              ),
            );
        else {
          await this.db.insert(s.architectureConnections).values({ ...fields, graphId: g.id });
          if (sourceReferenceIds.length)
            await this.db
              .insert(s.connectionProvenance)
              .values(
                sourceReferenceIds.map((referenceId) => ({
                  connectionId: e.id,
                  graphId: g.id,
                  referenceId,
                })),
              );
        }
      }
    }
    for (const l of next.innerLinks) {
      const before = previous.innerLinks.find((p) => p.id === l.id);
      if (!before || before.parentNodeId !== l.parentNodeId)
        await this.db
          .insert(s.innerArchitectureReferences)
          .values({
            ...l,
            architectureId,
            parentGraphId: next.graphs.find((g) => g.nodes.some((n) => n.id === l.parentNodeId))!
              .id,
          });
    }
  }
}
