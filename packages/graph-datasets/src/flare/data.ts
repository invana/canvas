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

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import flareJson from './flare.json';

/** Node shape in the original Flare hierarchy. Leaves carry `value`; inner
 *  nodes carry `children`. The root has neither field guaranteed. */
interface FlareNode {
  name: string;
  value?: number;
  children?: FlareNode[];
}

/** The original Flare hierarchy in its nested form. */
export const flareHierarchy: FlareNode = flareJson as FlareNode;

/**
 * Flatten {@link flareHierarchy} to a `{nodes, edges}` shape compatible with
 * `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
 * ids so duplicate names across branches stay distinct.
 */
export function flareAsGraph() {
  const nodes: (GraphNode & {
    data: {
      name: string;
      depth: number;
      isLeaf: boolean;
      value?: number;
      group?: string;
    };
  })[] = [];
  const edges: GraphEdge[] = [];
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
export const data = flareAsGraph();

/**
 * Recommended look for the **Flare** package hierarchy.
 *
 * The flattened Flare tree is the canonical d3-hierarchy fixture, so these
 * settings assume a hierarchical layout the consumer mounts under the id `layout`
 * (`D3HierarchyLayout` in `tree` mode is the obvious pick) rather than the bundle's
 * force sim. Leaves and branches are the same mark — depth is carried by position.
 */
export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 3.5 },
          bgFill: 0x818cf8,
          bgStrokeWidth: 0,
          labelFontSize: 9,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.8,
          strokeAlpha: 0.5,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: { layout: { mode: 'tree', nodeSize: [12, 160] } },
  behaviours: { color: { enabled: false } },
};
