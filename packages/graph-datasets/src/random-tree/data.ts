/**
 * Procedurally-generated tree, for force-layout stress tests and
 * tree-shaped demos.
 *
 * Node `i + 1`'s parent is node `floor(sqrt(i))`, which yields a
 * branchy, square-root-balanced tree in O(n) time with no RNG.
 *
 * The export uses a minimal `{ index }` / `{ source, target }` shape.
 * Map it onto `GraphNode` / `GraphEdge` at the call site (see the
 * `RandomTree` story for an example).
 *
 * @example
 * import { generateRandomTree } from '@invana/graph-datasets';
 * const tree = generateRandomTree(500);
 */

import type { CanvasData } from '../types';

export interface RandomTreeNode {
  index: number;
}

export interface RandomTreeEdge {
  source: number;
  target: number;
}

export interface RandomTreeData {
  nodes: RandomTreeNode[];
  edges: RandomTreeEdge[];
}

export const generateRandomTree = (numNodes: number): RandomTreeData => {
  const nodes = Array.from({ length: numNodes }, (_, i) => ({ index: i }));
  const edges = Array.from({ length: numNodes - 1 }, (_, i) => ({
    source: Math.floor(Math.sqrt(i)),
    target: i + 1,
  }));
  return { nodes, edges };
};

/**
 * A 120-node random tree — the default instance. Call
 * {@link generateRandomTree} for a different size.
 */
export const data: CanvasData = generateRandomTree(120) as unknown as CanvasData;
