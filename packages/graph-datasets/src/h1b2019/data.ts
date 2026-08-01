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

import type { CanvasData } from '../types';

import h1bJson from './h1b2019.json';

/**
 * Node shape in the rolled-up H-1B hierarchy. Identical structure to
 * {@link FlareNode}: leaves carry `value`, inner nodes (root, states, cities)
 * carry `children`.
 */
export interface H1B2019Node {
  name: string;
  value?: number;
  children?: H1B2019Node[];
}

/**
 * A single node in the flat projection. The id is the slash-joined path
 * from the root (e.g. `H-1B 2019/CA/SAN JOSE/GOOGLE LLC`) so duplicate
 * employer / city names across states stay distinct.
 */
export interface H1B2019GraphNode {
  id: string;
  data: {
    /** Original `name` field — state abbreviation, city name, or employer. */
    name: string;
    /** Depth from root. Root = 0, state = 1, city = 2, employer = 3. */
    depth: number;
    /** True iff this node has no children (i.e. an employer leaf). */
    isLeaf: boolean;
    /** Sum of petition counts for this leaf. Inner nodes omit it. */
    value?: number;
    /**
     * Top-level category — the depth-1 ancestor's name (the U.S. state
     * abbreviation, e.g. `CA`, `NY`, `TX`). Depth-1 nodes carry their own
     * name here; the root (depth 0) carries `undefined`. Drives categorical
     * colouring by state for bubble-chart-style renders.
     */
    group?: string;
  };
}

/** A single parent→child edge in the flat projection. */
export interface H1B2019GraphEdge {
  id: string;
  source: string;
  target: string;
}

/** Output of {@link h1b2019AsGraph}. */
export interface H1B2019GraphData {
  nodes: H1B2019GraphNode[];
  edges: H1B2019GraphEdge[];
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
export function h1b2019AsGraph(): H1B2019GraphData {
  const nodes: H1B2019GraphNode[] = [];
  const edges: H1B2019GraphEdge[] = [];
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
export const data: CanvasData = h1b2019AsGraph() as unknown as CanvasData;
