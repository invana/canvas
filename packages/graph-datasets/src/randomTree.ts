/**
 * Procedurally-generated random tree, for force-layout stress tests and
 * tree-shaped demos.
 *
 * Each non-root node picks a uniformly-random earlier node as its
 * parent. This yields a "branchy" shape (no single chain dominates)
 * while keeping the algorithm trivial — O(n) time, no balancing,
 * deterministic given a `seed`.
 *
 * Export shape is structurally compatible with `GraphData` from
 * `@invana/graph` — pass it straight to `graph.setData()` (per-node
 * `depth` lives on `data` for colour-by-depth demos).
 *
 * @example
 * import { generateRandomTree } from '@invana/graph-datasets';
 * const tree = generateRandomTree(500, 42);
 * graph.setData(tree);
 */

export interface RandomTreeNodeData {
  /** 0 at the root, +1 per generation. Useful for colour-by-depth. */
  depth: number;
}

export interface RandomTreeNode {
  id: string;
  data: RandomTreeNodeData;
}

export interface RandomTreeEdge {
  id: string;
  source: string;
  target: string;
}

export interface RandomTreeData {
  nodes: RandomTreeNode[];
  edges: RandomTreeEdge[];
}

/**
 * Generate a random tree of `count` nodes.
 *
 * @param count Total node count, including the root. `0` returns empty.
 * @param seed Seed for the internal LCG so output is reproducible.
 *             Default `1`.
 */
export function generateRandomTree(count: number, seed = 1): RandomTreeData {
  const nodes: RandomTreeNode[] = [];
  const edges: RandomTreeEdge[] = [];
  if (count <= 0) return { nodes, edges };

  // Tiny LCG — adequate for picking parents; not for crypto.
  let s = seed >>> 0;
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const depths: number[] = [0];
  nodes.push({ id: '0', data: { depth: 0 } });
  for (let i = 1; i < count; i++) {
    const parentIdx = Math.floor(rand() * i);
    const depth = depths[parentIdx]! + 1;
    depths.push(depth);
    nodes.push({ id: String(i), data: { depth } });
    edges.push({ id: `e${i}`, source: String(parentIdx), target: String(i) });
  }
  return { nodes, edges };
}
