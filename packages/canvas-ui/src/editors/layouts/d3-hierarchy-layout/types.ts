/**
 * Types for the D3HierarchyLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-hierarchy` (home of
 * `D3HierarchyLayout` and its options) is **not** imported — canvas-ui may only
 * use `@invana/graph` types (package CLAUDE.md). The editable option shape is
 * mirrored here as {@link D3HierarchyLayoutOptions}, a serialisable patch the
 * consumer applies (a layout re-run / `setOptions`). Keep the enums / fields in
 * sync by hand.
 */

/**
 * Layout mode.
 * - `'tree'` / `'cluster'` — Cartesian tidy-tree / dendrogram.
 * - `'radial-tree'` / `'radial-cluster'` — polar projections of the above.
 * - `'pack'` — circle-packing enclosure.
 * - `'sunburst'` — polar partition (annular sectors).
 */
export type D3HierarchyLayoutMode =
  | 'tree'
  | 'cluster'
  | 'radial-tree'
  | 'radial-cluster'
  | 'pack'
  | 'sunburst';

/** Cartesian-mode orientation. Ignored in `radial-*` / `pack` / `sunburst`. */
export type CartesianOrientation = 'vertical' | 'horizontal';

/**
 * The subset of `D3HierarchyLayoutOptions` this editor produces — a
 * serialisable patch. `size` / `nodeSize` are flattened into their two scalar
 * components (`sizeWidth`/`sizeHeight`, `nodeSizeX`/`nodeSizeY`); `center` is
 * kept nested. Function options (`separation`, `value`, `sort`) and registry
 * wiring (`id` / `targetLayerId`) are out of scope; the tunable scalars
 * round-trip. `transition` / `transitionEase` come from the shared one-shot
 * layout base (vetoed at runtime for `pack` / `sunburst`).
 */
export interface D3HierarchyLayoutOptions {
  mode?: D3HierarchyLayoutMode;
  rootId?: string;
  /** `tree.size([w, h])` / `cluster.size([w, h])`. Cartesian modes. */
  size?: [number, number];
  /** `tree.nodeSize([dx, dy])`. Mutually exclusive with `size`. */
  nodeSize?: [number, number];
  /** Polar radius for `radial-*` modes. Default `400`. */
  radius?: number;
  /** Cartesian orientation. Default `'vertical'`. */
  orientation?: CartesianOrientation;
  /** Translate the projected coordinates by `(x, y)` after layout. */
  center?: { x?: number; y?: number };
  /** Pack-only: padding between sibling circles. */
  padding?: number;
  transition?: boolean;
  transitionEase?: string;
}

/**
 * Flat form-field shape. The `size` / `nodeSize` tuples are split into scalar
 * pairs and `center: { x, y }` into `centerX` / `centerY` (see `mapping.ts`);
 * everything else matches {@link D3HierarchyLayoutOptions} 1:1.
 */
export interface D3HierarchyLayoutFields {
  mode?: D3HierarchyLayoutMode;
  rootId?: string;
  sizeWidth?: number;
  sizeHeight?: number;
  nodeSizeX?: number;
  nodeSizeY?: number;
  radius?: number;
  orientation?: CartesianOrientation;
  centerX?: number;
  centerY?: number;
  padding?: number;
  transition?: boolean;
  transitionEase?: string;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface D3HierarchyLayoutFormState {
  options: D3HierarchyLayoutFields;
}
