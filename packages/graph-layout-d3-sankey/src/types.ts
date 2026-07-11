import type { LayoutOptions } from '@invana/canvas';
import type { SankeyNodeMinimal, SankeyLinkMinimal } from 'd3-sankey';

/**
 * Column-alignment strategy. Mirrors d3-sankey's `nodeAlign` setters:
 *
 * - `'left'` — push every node as far left as possible (depth = longest path
 *   from a source). Sources column together on the left, sinks float toward
 *   the right depending on their depth.
 * - `'right'` — mirror of `'left'`: sinks together on the right, sources
 *   float toward the left.
 * - `'center'` — average of left and right; tidy when the graph is roughly
 *   symmetric.
 * - `'justify'` (default) — sources on the left, sinks on the right; every
 *   node is pushed to the latest column it can occupy without rerouting.
 *   This is the d3 example's default and the one to pick first.
 */
export type D3SankeyNodeAlign = 'left' | 'right' | 'center' | 'justify';

/**
 * Working types used by the layout when handing data to `d3-sankey`. They
 * mirror the original `GraphNode` / `GraphEdge` ids so we can map the
 * `d3-sankey` output back onto the store after the run.
 */
export interface SankeyNodeRef extends SankeyNodeMinimal<SankeyNodeRef, SankeyLinkRef> {
  id: string;
}
export interface SankeyLinkRef extends SankeyLinkMinimal<SankeyNodeRef, SankeyLinkRef> {
  id: string;
  source: string | SankeyNodeRef;
  target: string | SankeyNodeRef;
  value: number;
}

/**
 * `D3SankeyLayout` options.
 *
 * Mirrors `d3-sankey`'s configuration surface 1:1. All fields are optional;
 * defaults follow d3's defaults except `size`, which defaults to
 * `[1000, 600]` so a fresh layout has somewhere to draw.
 *
 * Extends {@link LayoutOptions}, so it also accepts `id` / `targetLayerId`
 * (registry + `config.activeLayout` wiring). Sankey snaps (no position
 * transition — it replaces node rect sizes + edge ribbons).
 */
export interface D3SankeyLayoutOptions extends LayoutOptions {
  /**
   * Include explicitly-hidden nodes in the layout. Default `false` — hidden
   * nodes (and links touching them) are excluded so they don't take up columns,
   * and their last positions stay frozen.
   */
  includeHidden?: boolean;

  /**
   * Viewport size `[width, height]` the layout fills. Translated to
   * `d3.sankey().extent([[0, 0], [width, height]])`. Default `[1000, 600]`.
   */
  size?: [number, number];

  /** Column rectangle width in pixels. Default `24` (d3's default). */
  nodeWidth?: number;

  /** Vertical padding between nodes within a column. Default `8` (d3's default). */
  nodePadding?: number;

  /** Relaxation iterations. More = tighter packing, slower run. Default `6`. */
  iterations?: number;

  /** Column-alignment strategy. See {@link D3SankeyNodeAlign}. Default `'justify'`. */
  nodeAlign?: D3SankeyNodeAlign;

  /**
   * Sibling node sort within a column. `null` preserves d3's default
   * (ascending by incoming flow); `undefined` falls back to the default;
   * a function sorts explicitly.
   */
  nodeSort?: ((a: SankeyNodeRef, b: SankeyNodeRef) => number) | null;

  /**
   * Link sort within each node's source-side / target-side stack. `null`
   * preserves d3's default order; `undefined` falls back to the default.
   */
  linkSort?: ((a: SankeyLinkRef, b: SankeyLinkRef) => number) | null;

  /**
   * Translate the projected coordinates by `(x, y)` after layout. Default
   * `{ x: 0, y: 0 }`. Useful for centring the diagram around the world
   * origin so a fresh `fitContent` frames it naturally.
   */
  center?: { x?: number; y?: number };
}
