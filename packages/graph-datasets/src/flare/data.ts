/**
 * The classic **Flare** software hierarchy — the same dataset used in
 * d3-hierarchy's tidy / radial / treemap examples.
 *
 * Two shapes are exposed:
 *  - `flareHierarchy` — the original nested `{name, value?, children?}` tree.
 *  - `flareAsGraph()` — a flat `{nodes, edges}` projection that drops
 *    straight into `GraphLayer.setData`. Each edge points from parent to
 *    child, so a hierarchy layout (e.g. `D3HierarchyLayout`) can read the
 *    topology directly off `edge.source → edge.target`.
 *
 * @example
 * import { flareAsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(flareAsGraph());
 */

import type { GraphData } from '@invana/graph';

import flareJson from './flare.json';

/** Node shape in the original Flare hierarchy. Leaves carry `value`; inner
 *  nodes carry `children`. The root has neither field guaranteed. */
export interface FlareNode {
  name: string;
  value?: number;
  children?: FlareNode[];
}

/** A single node in the flat projection. The id is the slash-joined path
 *  from the root (e.g. `flare/analytics/cluster/AgglomerativeCluster`) so
 *  it survives duplicate `name` values across branches. */
export interface FlareGraphNode {
  id: string;
  data: {
    /** Original `name` field. Convenient for labels once those land. */
    name: string;
    /** Depth from root. Root is 0. */
    depth: number;
    /** True iff this node has no children. */
    isLeaf: boolean;
    /** Original `value` field, if present (only on leaves). */
    value?: number;
    /**
     * Top-level category — the depth-1 ancestor's name (e.g. `analytics`,
     * `animate`, `data`, ...). Depth-1 nodes carry their own name here;
     * the root (depth 0) carries `undefined`. Drives categorical colour
     * in the bubble-chart layout, since every leaf inherits the same
     * `group` as every other leaf under the same top-level branch.
     */
    group?: string;
  };
}

/** A single parent→child edge in the flat projection. */
export interface FlareGraphEdge {
  id: string;
  source: string;
  target: string;
}

/** Output of {@link flareAsGraph}. */
export interface FlareGraphData {
  nodes: FlareGraphNode[];
  edges: FlareGraphEdge[];
}

/** The original Flare hierarchy in its nested form. */
export const flareHierarchy: FlareNode = flareJson as FlareNode;

/**
 * Flatten {@link flareHierarchy} to a `{nodes, edges}` shape compatible with
 * `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
 * ids so duplicate names across branches stay distinct.
 */
export function flareAsGraph(): FlareGraphData {
  const nodes: FlareGraphNode[] = [];
  const edges: FlareGraphEdge[] = [];
  let edgeCounter = 0;

  interface Pending {
    node: FlareNode;
    parentId: string | null;
    path: string;
    depth: number;
    /** Top-level category (depth-1 ancestor name). Set when we descend
     *  into a depth-1 node and inherited by everything beneath it. */
    group: string | undefined;
  }

  const queue: Pending[] = [
    {
      node: flareHierarchy,
      parentId: null,
      path: flareHierarchy.name,
      depth: 0,
      group: undefined,
    },
  ];

  while (queue.length > 0) {
    const { node, parentId, path, depth, group } = queue.shift()!;
    const isLeaf = !node.children || node.children.length === 0;
    nodes.push({
      id: path,
      data: {
        name: node.name,
        depth,
        isLeaf,
        ...(node.value !== undefined ? { value: node.value } : {}),
        ...(group !== undefined ? { group } : {}),
      },
    });
    if (parentId !== null) {
      edges.push({ id: `e${edgeCounter++}`, source: parentId, target: path });
    }
    if (node.children) {
      for (const child of node.children) {
        queue.push({
          node: child,
          parentId: path,
          path: `${path}/${child.name}`,
          depth: depth + 1,
          // Depth-1 nodes seed `group` from their own name; deeper nodes
          // inherit it from their parent so every leaf carries the same
          // top-level category as the branch it lives under.
          group: depth === 0 ? child.name : group,
        });
      }
    }
  }

  return { nodes, edges };
}

/** The flattened Flare hierarchy, engine-ready. Same value as {@link flareAsGraph}(). */
export const data: GraphData = flareAsGraph() as unknown as GraphData;
