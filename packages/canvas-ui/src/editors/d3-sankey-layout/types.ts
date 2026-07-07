/**
 * Types for the D3SankeyLayout editor.
 *
 * Engine-agnostic: `@invana/graph-layout-d3-sankey` (home of `D3SankeyLayout`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link D3SankeyLayoutOptions}, a serialisable patch the consumer applies (a
 * layout re-run / `setOptions`). Keep the enum / fields in sync by hand.
 */

/**
 * Column-alignment strategy. Mirrors d3-sankey's `nodeAlign` setters.
 * `'justify'` (default) puts sources left, sinks right.
 */
export type D3SankeyNodeAlign = 'left' | 'right' | 'center' | 'justify';

/**
 * The subset of `D3SankeyLayoutOptions` this editor produces — a serialisable
 * patch. `size` is flattened into `sizeWidth` / `sizeHeight`; `center` is kept
 * nested. Function options (`nodeSort`, `linkSort`) and registry wiring (`id` /
 * `targetLayerId`) are out of scope. Sankey snaps — there is no `transition`.
 */
export interface D3SankeyLayoutOptions {
  /** Viewport size `[width, height]` the layout fills. Default `[1000, 600]`. */
  size?: [number, number];
  /** Column rectangle width. Default `24`. */
  nodeWidth?: number;
  /** Vertical padding between nodes within a column. Default `8`. */
  nodePadding?: number;
  /** Relaxation iterations. Default `6`. */
  iterations?: number;
  /** Column-alignment strategy. Default `'justify'`. */
  nodeAlign?: D3SankeyNodeAlign;
  /** Translate the projected coordinates by `(x, y)` after layout. */
  center?: { x?: number; y?: number };
}

/**
 * Flat form-field shape. The `size` tuple is split into `sizeWidth` /
 * `sizeHeight` and `center: { x, y }` into `centerX` / `centerY` (see
 * `mapping.ts`); everything else matches {@link D3SankeyLayoutOptions} 1:1.
 */
export interface D3SankeyLayoutFields {
  sizeWidth?: number;
  sizeHeight?: number;
  nodeWidth?: number;
  nodePadding?: number;
  iterations?: number;
  nodeAlign?: D3SankeyNodeAlign;
  centerX?: number;
  centerY?: number;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface D3SankeyLayoutFormState {
  options: D3SankeyLayoutFields;
}
