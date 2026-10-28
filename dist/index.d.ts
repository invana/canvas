import { LayoutOptions, Layout, LayoutRunOptions } from '@invana/canvas-core';
import { GraphLayer } from '@invana/graph';
import { SankeyNodeMinimal, SankeyLinkMinimal } from 'd3-sankey';

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
type D3SankeyNodeAlign = 'left' | 'right' | 'center' | 'justify';
/**
 * Working types used by the layout when handing data to `d3-sankey`. They
 * mirror the original `GraphNode` / `GraphEdge` ids so we can map the
 * `d3-sankey` output back onto the store after the run.
 */
interface SankeyNodeRef extends SankeyNodeMinimal<SankeyNodeRef, SankeyLinkRef> {
    id: string;
}
interface SankeyLinkRef extends SankeyLinkMinimal<SankeyNodeRef, SankeyLinkRef> {
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
interface D3SankeyLayoutOptions extends LayoutOptions {
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
    center?: {
        x?: number;
        y?: number;
    };
}

/**
 * `D3SankeyLayout` — `Layout` for `@invana/graph` that wraps `d3-sankey`.
 *
 * Treats the graph as a DAG of flows: edges carry a numeric `value` (read
 * from `edge.data.value`), `d3-sankey` arranges nodes into columns and
 * solves for vertical positions that minimise link crossings.
 *
 * One-shot synchronous: `apply()` snapshots the store, runs the sankey
 * solver once, bulk-writes positions plus per-edge anchor opts, emits
 * `start` → `tick` → `end`, and resolves. No tick loop.
 *
 * NOTE: this layout extends `Layout` directly (not `OneShotPositionLayout`).
 * Its write is a single, tightly-ordered `store.batch` — positions, the solved
 * rect sizes, and the per-edge `edge-port` ribbon anchors must land in ONE flush
 * (the anchors are computed against the final rects). It also has no meaningful
 * position transition (it replaces node geometry + ribbons). Both make the
 * generic one-shot base a poor fit, so it stays standalone.
 *
 * The layout writes:
 *  - per node: position (centre of the d3-sankey rect), and `style.shape`
 *    `{ kind: 'rect', width, height }`.
 *  - per edge: `style.strokeWidth = link.width`, `style.shape.pathType =
 *    'bump-horizontal'` with per-endpoint `edge-port` anchors, and
 *    `arrowTargetShape: 'none'` (a ribbon never carries an arrowhead — and at
 *    flow-proportional widths the default `'triangle'` marker renders as a huge
 *    wedge).
 *
 * Pair with `edge: { style: { shape: { pathType: 'bump-horizontal' }, strokeAlpha: 0.5 } }`
 * on the `GraphLayer` to reproduce d3-sankey's SVG appearance.
 *
 * @example
 * const layout = new D3SankeyLayout({ id: 'sankey', targetLayerId: 'graph', size: [1200, 720] });
 * await layout.apply(graphLayer);
 */

declare class D3SankeyLayout extends Layout<GraphLayer> {
    readonly kind = "d3-sankey-layout";
    private readonly opts;
    /** True while a run is active. Guards `stop()` so `end` only fires once. */
    private running;
    constructor(opts?: D3SankeyLayoutOptions);
    /**
     * Run the layout against `layer`. Resolves once positions and per-edge
     * hints have been written. Lifecycle events fire in order:
     * `start` → `tick` (once) → `end`.
     *
     * `run` is recorded on {@link runOptions}; anchoring is not supported — a
     * sankey's columns are fixed by the flow, so there is nothing to re-flow
     * around one node.
     */
    apply(layer: GraphLayer, run?: LayoutRunOptions): Promise<void>;
    /** Cancel a run. The synchronous body of `apply()` rarely yields long
     *  enough for this to fire, but it keeps the contract symmetric with
     *  iterative layouts. */
    stop(): void;
}

export { D3SankeyLayout, type D3SankeyLayoutOptions, type D3SankeyNodeAlign };
