import type { HierarchyNode } from 'd3-hierarchy';

/**
 * Layout mode.
 *
 * - `'tree'` — `d3.tree()` tidy layout, Cartesian (x, y) positions.
 * - `'cluster'` — `d3.cluster()` dendrogram (leaves aligned), Cartesian positions.
 * - `'radial-tree'` — `d3.tree()` projected to polar coordinates.
 * - `'radial-cluster'` — `d3.cluster()` projected to polar coordinates.
 */
export type D3HierarchyLayoutMode = 'tree' | 'cluster' | 'radial-tree' | 'radial-cluster';

/**
 * Per-pair separation accessor — passed straight through to d3's
 * `.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.
 */
export type SeparationFn = (
  a: HierarchyNode<{ id: string }>,
  b: HierarchyNode<{ id: string }>,
) => number;

/**
 * `D3HierarchyLayout` options.
 *
 * **All options default to `undefined`.** Only `mode` has an internal default
 * (`'radial-tree'`). Anything you omit falls through to d3-hierarchy's own
 * defaults — no setter is called when you don't provide a value.
 */
export interface D3HierarchyLayoutOptions {
  /** Layout mode. Default `'radial-tree'`. */
  mode?: D3HierarchyLayoutMode;

  /**
   * Explicit root node id. If omitted, the layout auto-detects the root as
   * the unique node with no incoming edge in the snapshot. Throws if there
   * is none or more than one.
   */
  rootId?: string;

  /**
   * `tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes default
   * to `[640, 480]` if neither `size` nor `nodeSize` is provided.
   *
   * For radial modes, the underlying d3 layout uses `[2π, radius]` —
   * configure the polar layout with `radius` (and optionally `nodeSize` for
   * per-node angular spacing) instead.
   */
  size?: [number, number];

  /**
   * `tree.nodeSize([dx, dy])` / `cluster.nodeSize([dx, dy])`. Mutually
   * exclusive with `size`.
   */
  nodeSize?: [number, number];

  /**
   * Polar radius for `radial-*` modes. Default `400`. Ignored for Cartesian
   * modes.
   */
  radius?: number;

  /** Custom separation function. See d3-hierarchy `tree.separation`. */
  separation?: SeparationFn;

  /**
   * Translate the projected coordinates by `(x, y)` after layout. Default
   * `{ x: 0, y: 0 }`. Useful for centring the cluster around the world
   * origin in radial modes (the default already does this).
   */
  center?: { x?: number; y?: number };
}
