import type { HierarchyNode } from 'd3-hierarchy';

/**
 * Layout mode.
 *
 * - `'tree'` — `d3.tree()` tidy layout, Cartesian (x, y) positions.
 * - `'cluster'` — `d3.cluster()` dendrogram (leaves aligned), Cartesian positions.
 * - `'radial-tree'` — `d3.tree()` projected to polar coordinates.
 * - `'radial-cluster'` — `d3.cluster()` projected to polar coordinates.
 * - `'pack'` — `d3.pack()` enclosure layout. Each node is sized by the
 *   accumulated `value` and positioned so children are packed inside the
 *   parent's circle. The layout also writes per-node sizes onto each node
 *   (`data.size = 2 * r`), so the renderer can draw the correct circle
 *   diameter; this is unique to pack and is why it needs `value`.
 * - `'sunburst'` — `d3.partition()` over polar coordinates. Each node becomes
 *   an annular sector; positions all collapse to `(center.x, center.y)` and
 *   the per-node shape (innerR / outerR / startAngle / endAngle) is written
 *   onto `data` so the renderer can paint it as an `'arc'` shape. Sized off
 *   the accumulated `value` like pack. Ring radii grow with `sqrt(y)` so
 *   every ring covers an area proportional to its summed leaves — the
 *   convention d3's example uses.
 */
export type D3HierarchyLayoutMode =
  | 'tree'
  | 'cluster'
  | 'radial-tree'
  | 'radial-cluster'
  | 'pack'
  | 'sunburst';

/**
 * Per-pair separation accessor — passed straight through to d3's
 * `.separation(fn)` setter on `tree()` / `cluster()`. See d3-hierarchy docs.
 */
export type SeparationFn = (
  a: HierarchyNode<{ id: string }>,
  b: HierarchyNode<{ id: string }>,
) => number;

/**
 * Cartesian-mode orientation.
 *
 * - `'vertical'` (default) — depth axis runs top-to-bottom; root at top,
 *   leaves at bottom. Pairs naturally with `pathType: 'bezier'` (axis 'auto'
 *   picks vertical) or `pathType: 'smooth'`.
 * - `'horizontal'` — depth axis runs left-to-right; root on the left,
 *   leaves aligned on the right. Matches the d3 cluster / tidy-tree
 *   examples. Pairs with `pathType: 'bezier'` (axis 'auto' picks horizontal).
 *
 * Ignored in `radial-*` modes.
 */
export type CartesianOrientation = 'vertical' | 'horizontal';

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

  /**
   * Cartesian orientation. Default `'vertical'`. See {@link CartesianOrientation}.
   * Ignored in `radial-*` modes.
   */
  orientation?: CartesianOrientation;

  /** Custom separation function. See d3-hierarchy `tree.separation`. */
  separation?: SeparationFn;

  /**
   * Translate the projected coordinates by `(x, y)` after layout. Default
   * `{ x: 0, y: 0 }`. Useful for centring the cluster around the world
   * origin in radial modes (the default already does this).
   */
  center?: { x?: number; y?: number };

  // ─── pack mode ───────────────────────────────────────────────────────

  /**
   * Pack-only: padding between sibling circles, in world units. Default `0`
   * (d3's default). Ignored in non-pack modes.
   */
  padding?: number;

  /**
   * Pack-only: per-node value accessor used by `hierarchy.sum()`. Defaults
   * to reading `node.data.value` (treats missing as `1`). The accumulated
   * sum drives each circle's radius. Ignored in non-pack modes.
   *
   * Note: the input is the raw `GraphNode<unknown>`, not the d3 hierarchy
   * node. Cast `data` if you know its shape.
   */
  value?: (node: { id: string; data?: unknown }) => number;

  /**
   * Pack-only: sibling sort comparator. Defaults to `(a, b) => b.value - a.value`
   * (descending by value, which gives a tighter pack). Set to `null` to
   * leave d3's input order. Ignored in non-pack modes.
   */
  sort?:
    | ((a: { value?: number }, b: { value?: number }) => number)
    | null;
}
