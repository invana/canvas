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
import type { EventMap } from '@invana/canvas';

/** Per-set visual style. Resolved against {@link BUBBLE_SET_STYLE_DEFAULTS}. */
export interface BubbleSetStyle {
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
export interface BubbleSetLabel {
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
export interface BubbleSet {
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
export interface BubbleSetsLayerOptions {
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
export interface BubbleSetsLayerState {
  readonly _placeholder?: never;
}

export interface BubbleSetsLayerEvents extends EventMap {
  /** Fired after each full recompute, before paint. */
  recompute: { sets: number; durationMs: number };
  /** Fired once per set after it's painted. */
  'set:painted': { setId: string; vertices: number };
}

/** Style defaults applied per set when fields are absent. */
export const BUBBLE_SET_STYLE_DEFAULTS = {
  fill: 0x9c88ff,
  fillOpacity: 0.25,
  strokeOpacity: 0.9,
  strokeWidth: 1.5,
} as const;

/** Algorithm-side defaults. Mirrors `bubblesets-js` defaults where possible. */
export const BUBBLE_SETS_LAYER_DEFAULTS = {
  pixelGroup: 4,
  nodeR0: 15,
  nodeR1: 50,
  edgeR0: 10,
  edgeR1: 20,
  morphBuffer: 10,
  maxRoutingIterations: 100,
  maxMarchingIterations: 20,
  smoothness: 'chaikin' as 'none' | 'bspline' | 'chaikin',
  chaikinIterations: 4,
  recompute: 'auto' as 'auto' | 'manual',
  recomputeDebounceMs: 120,
} as const;
