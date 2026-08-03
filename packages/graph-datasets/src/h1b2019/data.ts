/**
 * **H-1B 2019** — USCIS H-1B employer petition counts for fiscal year 2019,
 * aggregated into a **State → City → Employer** hierarchy. The same dataset
 * used in the d3 [`pack-rollup`](https://observablehq.com/@d3/pack-rollup/2)
 * example. Source: [USCIS H-1B Data Hub](https://www.uscis.gov/h-1b-data-hub).
 *
 * Aggregation was done offline (see `tools/build-h1b2019.ts` or the
 * data-import note below) so the package ships a single static JSON instead
 * of a 1.8 MB CSV that would need parsing at import time. The leaf `value` is
 * the sum of all four petition outcomes for that employer / city / state:
 *
 *     value = InitialApprovals + InitialDenials
 *           + ContinuingApprovals + ContinuingDenials
 *
 * matching d3.rollup's:
 *
 *     d3.rollup(rows, D => d3.sum(D, d => d.IA + d.ID + d.CA + d.CD),
 *               d => d.State, d => d.City, d => d.Employer)
 *
 * Employers with a zero total are pruned during aggregation — d3.pack treats
 * zero-value leaves as 0-radius circles, so removing them avoids cluttering
 * the layout with invisible nodes.
 *
 * Two shapes are exposed, mirroring the Flare API:
 *  - `h1b2019Hierarchy` — the original nested `{name, value?, children?}` tree.
 *  - `h1b2019AsGraph()` — flat `{nodes, edges}` projection, ready for
 *    `GraphLayer.setData`.
 *
 * @example
 * import { h1b2019AsGraph } from '@invana/graph-datasets';
 * graphLayer.setData(h1b2019AsGraph());
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode } from '@invana/graph';

import h1bJson from './h1b2019.json';

/**
 * Node shape in the rolled-up H-1B hierarchy. Identical structure to
 * {@link FlareNode}: leaves carry `value`, inner nodes (root, states, cities)
 * carry `children`.
 */
interface H1B2019Node {
  name: string;
  value?: number;
  children?: H1B2019Node[];
}

/** The H-1B 2019 hierarchy in its nested form. */
export const h1b2019Hierarchy: H1B2019Node = h1bJson as H1B2019Node;

/**
 * Flatten {@link h1b2019Hierarchy} to a `{nodes, edges}` shape compatible with
 * `GraphLayer.setData`. BFS-traverses the tree, assigning slash-joined path
 * ids so duplicate names across branches stay distinct.
 *
 * Returns ~55 states + ~3 000 cities + ~22 000 employer leaves; allocating
 * each call is cheap (one pass over a 1 MB JSON), so consumers can re-call
 * after filtering settings change without caching.
 */
export function h1b2019AsGraph() {
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
    node: H1B2019Node;
    parentId: string | null;
    path: string;
    depth: number;
    /** Top-level category (depth-1 ancestor name = U.S. state). */
    group: string | undefined;
  }

  const queue: Pending[] = [
    {
      node: h1b2019Hierarchy,
      parentId: null,
      path: h1b2019Hierarchy.name,
      depth: 0,
      group: undefined,
    },
  ];

  while (queue.length > 0) {
    const { node, parentId, path, depth, group } = queue.shift()!;
    const isLeaf = !node.children || node.children.length === 0;
    nodes.push({
      // Depth *is* the entity kind in this rollup: 0 = the country root,
      // 1 = state, 2 = city, 3 = employer.
      type: (['root', 'state', 'city', 'employer'][depth] ?? 'employer'),
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
      edges.push({ id: `e${edgeCounter++}`, type: 'contains', source: parentId, target: path });
    }
    if (node.children) {
      for (const child of node.children) {
        queue.push({
          node: child,
          parentId: path,
          path: `${path}/${child.name}`,
          depth: depth + 1,
          // Depth-1 nodes seed `group` from their own name (the state); deeper
          // nodes inherit it so every employer carries the state it's in.
          group: depth === 0 ? child.name : group,
        });
      }
    }
  }

  return { nodes, edges };
}

/** The flattened H-1B hierarchy, engine-ready. Same value as {@link h1b2019AsGraph}(). */
export const data = h1b2019AsGraph();

/**
 * Recommended look for the **H-1B 2019** state → city → employer hierarchy.
 *
 * Four levels and thousands of leaves, so this expects a hierarchical layout
 * mounted under the id `layout` — radial or pack, where the leaf count is the point.
 * Marks stay tiny and labels off by default; a consumer that wants employer names
 * turns them on for the depth it cares about.
 */
export const settings: CanvasConfig = {
  activeLayout: 'layout',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 2.5 },
          bgFill: 0xfbbf24,
          bgStrokeWidth: 0,
          showLabel: false,
        },
      },
      edge: {
        style: {
          strokeColor: 0x94a3b8,
          strokeWidth: 0.6,
          strokeAlpha: 0.35,
          arrowTargetShape: 'none',
        },
      },
    },
  },
  layouts: { layout: { mode: 'radial-tree', radius: 520 } },
  behaviours: { color: { enabled: false } },
};
