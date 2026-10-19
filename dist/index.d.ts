import { EventMap, WorldLayer, WorldLayerHit, LayerOptions, CanvasContext } from '@invana/canvas';

/**
 * Public type surface for `@invana/graph-layer-bubble-sets`.
 *
 * The layer paints one **set** per group of node ids the user declares. Each
 * set produces a single smooth contour that encloses the member nodes (and
 * their selected edges, if provided) while routing around every other node
 * in the source `GraphLayer`. See `bubblesets-js` for the underlying
 * algorithm — these options surface its compute knobs plus per-set
 * presentation.
 */

/** Per-set visual style. Resolved against {@link BUBBLE_SET_STYLE_DEFAULTS}. */
interface BubbleSetStyle {
    /** Solid fill colour `0xRRGGBB`. Default `0x9c88ff`. */
    fill?: number;
    /** Fill alpha 0..1. Default `0.25`. */
    fillOpacity?: number;
    /** Stroke colour `0xRRGGBB`. Default same as {@link fill}. */
    stroke?: number;
    /** Stroke alpha 0..1. Default `0.9`. */
    strokeOpacity?: number;
    /** Stroke width in world units. Default `1.5`. */
    strokeWidth?: number;
}
/**
 * Optional label printed on the set's contour. Styling pulls from the set's
 * own {@link BubbleSetStyle} (background = `fill` at full opacity, text
 * picked for contrast). The flat field is intentionally minimal; richer
 * label control lands once we settle on a layer-wide label primitive.
 */
interface BubbleSetLabel {
    /** Required label text. */
    text: string;
    /**
     * Where to anchor the label.
     * - `'contour-end'` (default) — the last point of the contour, rotated to
     *   match the local tangent. Matches G6's BubbleSets label placement.
     * - `'centroid'` — average of contour points, no rotation.
     */
    placement?: 'contour-end' | 'centroid';
    /** Override text colour. Default contrasts with the set's fill. */
    color?: number;
    /** Font size in world units. Default `11`. */
    fontSize?: number;
}
/** A named, declarative grouping of nodes (and optionally edges). */
interface BubbleSet {
    /** Stable identity. Used as the set key for {@link updateSet}/{@link removeSet}. */
    id: string;
    /** Ids of {@link GraphNode}s to enclose. Required; an empty array skips paint. */
    members: readonly string[];
    /**
     * Optional ids of {@link GraphEdge}s to enclose. The layer feeds each
     * edge as a straight `source-center → target-center` segment to
     * BubbleSets' router; the algorithm morphs the contour to wrap them.
     * Edges whose endpoints aren't both members are still accepted —
     * useful for "include the bridging edge in this set's blob".
     */
    edges?: readonly string[];
    /** Per-set visual style; merged into {@link BUBBLE_SET_STYLE_DEFAULTS}. */
    style?: BubbleSetStyle;
    /** Optional label drawn over the contour. */
    label?: BubbleSetLabel;
}
/**
 * Options for {@link BubbleSetsLayer}. The shape mirrors
 * `@invana/graph-layer-d3-contour`: cross-layer dep + algorithm knobs +
 * `recompute` lifecycle, all optional except `graphLayerId` and `sets`.
 */
interface BubbleSetsLayerOptions {
    /**
     * Required. Id of the `GraphLayer` whose nodes feed the algorithm. Per
     * canvas architecture: cross-layer deps are declared explicitly, never
     * inferred. Throws on mount if the id can't be resolved.
     */
    graphLayerId: string;
    /** Initial set list. May be mutated post-mount via {@link BubbleSetsLayer.setSets}. */
    sets: readonly BubbleSet[];
    /**
     * Grid resolution in square world units. Smaller = sharper contours but
     * quadratically more compute. `bubblesets-js` default: `4`.
     */
    pixelGroup?: number;
    /**
     * Node-influence inner / outer radii (world units). Members attract the
     * contour out to {@link nodeR0} (full influence) and fall off to
     * {@link nodeR1} (zero influence); non-members repel over the same
     * envelope. Defaults: `15` / `50`.
     */
    nodeR0?: number;
    nodeR1?: number;
    /**
     * Edge-influence inner / outer radii (world units). Defaults: `10` / `20`.
     */
    edgeR0?: number;
    edgeR1?: number;
    /**
     * Padding added around the energy grid before sampling — keeps the
     * contour from clipping against the grid border. World units. Default `10`.
     */
    morphBuffer?: number;
    /**
     * Max routing iterations the algorithm runs to find a path that wraps
     * obstacles. Default `100`.
     */
    maxRoutingIterations?: number;
    /**
     * Max marching-squares refinement iterations. Default `20`.
     */
    maxMarchingIterations?: number;
    /**
     * Contour smoothing.
     * - `'chaikin'` (default) — Chaikin's corner-cutting subdivision applied
     *   to a sparsified copy of the marching-squares polyline. Produces the
     *   roundest, most organic curves; the iteration count is tunable via
     *   {@link chaikinIterations}.
     * - `'bspline'` — `PointPath.sample().bSplines()`, the canonical
     *   `bubblesets-js` / G6 pipeline. Slightly tighter to the member nodes
     *   than Chaikin, less "puffy".
     * - `'none'` — raw marching-squares polyline (jagged).
     */
    smoothness?: 'none' | 'bspline' | 'chaikin';
    /**
     * Number of Chaikin corner-cutting iterations when {@link smoothness} is
     * `'chaikin'`. Each iteration doubles the point count and rounds every
     * corner further; `4` is enough for visually smooth curves on graph-sized
     * inputs. Ignored otherwise. Default `4`.
     */
    chaikinIterations?: number;
    /**
     * Recompute trigger:
     * - `'auto'` (default) — subscribe to the source layer's `data:changed`
     *   and recompute on a debounce.
     * - `'manual'` — caller drives recompute via `layer.recompute()`.
     */
    recompute?: 'auto' | 'manual';
    /** Debounce window for `auto` recomputes. Default `120` ms. */
    recomputeDebounceMs?: number;
}
/**
 * Reserved. Set geometry is held as a private field, not in `Layer.state`,
 * because it's bulk geometry that's rebuilt wholesale on each recompute
 * rather than diffed.
 */
interface BubbleSetsLayerState {
    readonly _placeholder?: never;
}
interface BubbleSetsLayerEvents extends EventMap {
    /** Fired after each full recompute, before paint. */
    recompute: {
        sets: number;
        durationMs: number;
    };
    /** Fired once per set after it's painted. */
    'set:painted': {
        setId: string;
        vertices: number;
    };
}
/** Style defaults applied per set when fields are absent. */
declare const BUBBLE_SET_STYLE_DEFAULTS: {
    readonly fill: 10258687;
    readonly fillOpacity: 0.25;
    readonly strokeOpacity: 0.9;
    readonly strokeWidth: 1.5;
};
/** Algorithm-side defaults. Mirrors `bubblesets-js` defaults where possible. */
declare const BUBBLE_SETS_LAYER_DEFAULTS: {
    readonly pixelGroup: 4;
    readonly nodeR0: 15;
    readonly nodeR1: 50;
    readonly edgeR0: 10;
    readonly edgeR1: 20;
    readonly morphBuffer: 10;
    readonly maxRoutingIterations: 100;
    readonly maxMarchingIterations: 20;
    readonly smoothness: "none" | "bspline" | "chaikin";
    readonly chaikinIterations: 4;
    readonly recompute: "auto" | "manual";
    readonly recomputeDebounceMs: 120;
};

/**
 * `BubbleSetsLayer` — `WorldLayer` that paints one smooth contour per
 * declared set of node ids over a source `GraphLayer`. Backed by
 * [`bubblesets-js`](https://github.com/upsetjs/bubblesets-js) (Collins's
 * IEEE InfoVis 2009 algorithm).
 *
 * The compute lives in world space so contours track the graph under
 * camera pan and zoom. Recompute is debounced (default 120 ms) and
 * triggered by the source `GraphLayer`'s `data:changed`. BubbleSets is
 * O(members · grid²); per-frame recompute during a live drag would tank
 * perf — set `recompute: 'manual'` and call `layer.recompute()` from a
 * drag behaviour for that case.
 *
 * Set membership is data the layer owns. Mutate it via {@link setSets} /
 * {@link addSet} / {@link removeSet} / {@link updateSet}; each mutation
 * schedules the same debounced recompute as `data:changed`.
 */

declare class BubbleSetsLayer extends WorldLayer<BubbleSetsLayerOptions, BubbleSetsLayerState, BubbleSetsLayerEvents, never, WorldLayerHit> {
    readonly kind = "bubble-sets-layer";
    private readonly graphLayerId;
    private sets;
    private graph;
    private specs;
    private projector;
    /** Hull ids published last pass, so sets that vanish are retired. */
    private published;
    private readonly subs;
    private debounceTimer;
    constructor(opts: LayerOptions<BubbleSetsLayerOptions>);
    protected createState(): BubbleSetsLayerState;
    protected onMount(ctx: CanvasContext): void;
    protected onUnmount(): void;
    hitTest(_worldX: number, _worldY: number): WorldLayerHit | null;
    /** Replace the full set list. */
    setSets(sets: readonly BubbleSet[]): void;
    /** Append a set. No-op (with warning) if the id already exists. */
    addSet(set: BubbleSet): void;
    /** Remove a set by id. Returns `true` if anything was removed. */
    removeSet(id: string): boolean;
    /**
     * Shallow-merge `patch` into the set with the given id. Nested `style` /
     * `label` are also shallow-merged so callers can supply partial style /
     * label patches without rebuilding the whole object. Returns `true` if
     * the id was found.
     */
    updateSet(id: string, patch: Partial<Omit<BubbleSet, 'id'>>): boolean;
    /** Read-only view of the current set list. */
    getSets(): readonly BubbleSet[];
    /**
     * Force an immediate recompute. Useful in `recompute: 'manual'` mode, or
     * to refresh the overlay after externally mutating options that don't
     * have setters yet.
     */
    recompute(): void;
    private scheduleRecompute;
    private computeAndPaint;
    /**
     * World-space AABB for a node. `GraphLayer.boundsOfNode` returns the
     * shape's local (centre-relative) rect — `node.position` is *not* baked
     * in — so we offset by the node's position to get world coords. Falls
     * back to a small box around the position when the renderer hasn't
     * mounted the node yet.
     */
    private rectForNode;
    private algorithmOptions;
    /**
     * Describe one set's hull as a `path` spec and publish it. Returns the ids
     * used, so the caller can retire hulls that this pass no longer produces.
     *
     * The contour is a **closed quadratic spline** through segment midpoints —
     * `smooth: true` on the spec, so the shape does the tracing. That is what
     * turns marching-squares stair-stepping into a glassy contour, and it now
     * happens in the geometry rather than at draw time here.
     */
    private publishSet;
    /** Drop hulls published last pass that this pass no longer produced. */
    private retireHulls;
    /**
     * Label styling for a set's hull, as a `label` decoration on the hull spec.
     *
     * Placement is expressed as a screen-space offset from the hull's own centre,
     * because the decoration anchors to its host — so the anchor maths that used
     * to position a free-floating `Text` becomes an offset here. `contour-end`
     * keeps its tangent rotation; `centroid` sits at the middle with no rotation.
     */
    private labelStyleFor;
    private emitRecompute;
}

export { BUBBLE_SETS_LAYER_DEFAULTS, BUBBLE_SET_STYLE_DEFAULTS, type BubbleSet, type BubbleSetLabel, type BubbleSetStyle, BubbleSetsLayer, type BubbleSetsLayerEvents, type BubbleSetsLayerOptions, type BubbleSetsLayerState };
