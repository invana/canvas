/**
 * Procedurally-generated `n × n` lattice, for force-layout demos.
 *
 * Each node links to its right `(i, j+1)` and down `(i+1, j)` neighbour. Run
 * through a force simulation, the rigid links fight the n-body repulsion and the
 * grid settles into a gently-deformed lattice.
 *
 * Returns `@invana/graph` `GraphNode` / `GraphEdge` directly, so it feeds
 * `GraphLayer.setData` with no mapping:
 *
 * @example
 * import { generateLattice } from '@invana/graph-datasets';
 * graph.setData(generateLattice(20));
 */

import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';

export interface LatticeData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const generateLattice = (n: number): LatticeData => {
  const size = Math.max(2, Math.floor(n));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      nodes.push({ id: `${i},${j}` });
      if (j < size - 1) edges.push({ id: `h-${i}-${j}`, source: `${i},${j}`, target: `${i},${j + 1}` });
      if (i < size - 1) edges.push({ id: `v-${i}-${j}`, source: `${i},${j}`, target: `${i + 1},${j}` });
    }
  }

  return { nodes, edges };
};

/**
 * A 20×20 lattice — the default instance, for consumers that just want the
 * dataset rather than a specific size. Call {@link generateLattice} for others.
 */
export const data: GraphData = generateLattice(20) as unknown as GraphData;
