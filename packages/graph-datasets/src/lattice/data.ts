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

import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, GraphEdge, GraphNode } from '@invana/graph';

export const generateLattice = (n: number): GraphData => {
  const size = Math.max(2, Math.floor(n));
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      nodes.push({ type: 'cell', id: `${i},${j}` });
      if (j < size - 1)
        edges.push({ type: 'link',
          id: `h-${i}-${j}`,
          source: `${i},${j}`,
          target: `${i},${j + 1}`,
        });
      if (i < size - 1)
        edges.push({ type: 'link',
          id: `v-${i}-${j}`,
          source: `${i},${j}`,
          target: `${i + 1},${j}`,
        });
    }
  }

  return { nodes, edges };
};

/**
 * A 20×20 lattice — the default instance, for consumers that just want the
 * dataset rather than a specific size. Call {@link generateLattice} for others.
 */
export const data = generateLattice(20);

/**
 * Recommended look for the **lattice** grid.
 *
 * A regular n×n mesh is a stress test, not a picture of anything — so the marks
 * are as small as they can be while staying visible, and the links carry the
 * structure. The force layout's link distance is what sets the cell size; charge
 * stays weak so the mesh relaxes into a grid rather than exploding.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3 },
          bgFill: 0x60a5fa,
          bgStrokeWidth: 0,
        },
      },
      edge: {
        style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, strokeAlpha: 0.6 },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -30 },
      link: { distance: 30 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
  },
};
