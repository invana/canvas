/**
 * Procedurally-generated tree, for force-layout stress tests and
 * tree-shaped demos.
 *
 * Node `i + 1`'s parent is node `floor(sqrt(i))`, which yields a
 * branchy, square-root-balanced tree in O(n) time with no RNG.
 *
 * @example
 * import { generateRandomTree } from '@invana/graph-datasets';
 * const tree = generateRandomTree(500);
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';

/**
 * Build an `numNodes`-node tree, engine-ready — ids are the node index as a
 * string, so it drops straight into `setData` with no mapping at the call site.
 */
export const generateRandomTree = (numNodes: number): GraphData => ({
  nodes: Array.from({ length: numNodes }, (_, i) => ({ id: String(i), type: 'node' })),
  edges: Array.from({ length: numNodes - 1 }, (_, i) => ({
    id: `e${i}`,
    type: 'link',
    source: String(Math.floor(Math.sqrt(i))),
    target: String(i + 1),
  })),
});

/**
 * A 120-node random tree — the default instance. Call
 * {@link generateRandomTree} for a different size.
 */
export const data = generateRandomTree(120);

/**
 * Recommended look for the **random tree**.
 *
 * A tree reads best when the hierarchy is visible, so this leans on a strong
 * repulsion + short links to spread the branches instead of coiling them. Edges get
 * no arrowheads: the parent→child direction is obvious from the shape.
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 4 },
          bgFill: 0x34d399,
          bgStrokeWidth: 0,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.9,
          strokeAlpha: 0.55,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -180 },
      link: { distance: 26 },
      collide: {},
      animate: false,
    },
  },
  behaviours: { color: { enabled: false } },
};
