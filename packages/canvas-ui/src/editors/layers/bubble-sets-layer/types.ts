/**
 * Types for the BubbleSetsLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-bubble-sets` (home of `BubbleSetsLayer`
 * and its options) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (package CLAUDE.md). The editable option shape is mirrored here as
 * {@link BubbleSetsLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep the enums / fields in sync with the engine by hand.
 */

/** Contour smoothing algorithm. Mirrors the engine's `smoothness` union. */
export type BubbleSetsSmoothness = 'none' | 'bspline' | 'chaikin';

/** Recompute trigger — `'auto'` debounces on source changes; `'manual'` is caller-driven. */
export type BubbleSetsRecompute = 'auto' | 'manual';

/**
 * A default `BubbleSetStyle` mirror — the per-set visual style. Colours are
 * `0xRRGGBB` integers in the engine; see `mapping.ts` for the `#rrggbb` bridge.
 * The layer's `sets` carry their own style; this group edits a representative /
 * default style the consumer can apply to sets however it likes.
 */
export interface BubbleSetStyle {
  /** Solid fill colour `0xRRGGBB`. */
  fill?: number;
  /** Fill alpha 0..1. */
  fillOpacity?: number;
  /** Stroke colour `0xRRGGBB`. */
  stroke?: number;
  /** Stroke alpha 0..1. */
  strokeOpacity?: number;
  /** Stroke width in world units. */
  strokeWidth?: number;
}

/**
 * The subset of `BubbleSetsLayerOptions` this editor produces — a serialisable
 * patch. The `graphLayerId` cross-layer identity and the `sets` group
 * membership (node/edge id lists + per-set labels) are out of scope; the
 * remaining algorithm knobs plus a default {@link BubbleSetStyle} round-trip.
 */
export interface BubbleSetsLayerOptions {
  /** Grid resolution in square world units. Smaller = sharper, costlier. */
  pixelGroup?: number;
  /** Node-influence inner radius (full influence), world units. */
  nodeR0?: number;
  /** Node-influence outer radius (zero influence), world units. */
  nodeR1?: number;
  /** Edge-influence inner radius, world units. */
  edgeR0?: number;
  /** Edge-influence outer radius, world units. */
  edgeR1?: number;
  /** Padding around the energy grid before sampling, world units. */
  morphBuffer?: number;
  /** Max routing iterations to wrap obstacles. */
  maxRoutingIterations?: number;
  /** Max marching-squares refinement iterations. */
  maxMarchingIterations?: number;
  /** Contour smoothing algorithm. */
  smoothness?: BubbleSetsSmoothness;
  /** Chaikin corner-cutting iterations (used only when `smoothness === 'chaikin'`). */
  chaikinIterations?: number;
  /** Default per-set visual style. */
  style?: BubbleSetStyle;
  /** Recompute trigger. */
  recompute?: BubbleSetsRecompute;
  /** Debounce window for `auto` recomputes, in ms. */
  recomputeDebounceMs?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The nested
 * {@link BubbleSetStyle} group is flattened to `style`-prefixed scalars
 * (`styleFill`, `styleFillOpacity`, …) with colours as `#rrggbb` strings; see
 * `mapping.ts` for the round-trip.
 */
export interface BubbleSetsLayerFields {
  pixelGroup?: number;
  nodeR0?: number;
  nodeR1?: number;
  edgeR0?: number;
  edgeR1?: number;
  morphBuffer?: number;
  maxRoutingIterations?: number;
  maxMarchingIterations?: number;
  smoothness?: BubbleSetsSmoothness;
  chaikinIterations?: number;
  /** Default fill colour `#rrggbb`. */
  styleFill?: string;
  styleFillOpacity?: number;
  /** Default stroke colour `#rrggbb`. */
  styleStroke?: string;
  styleStrokeOpacity?: number;
  styleStrokeWidth?: number;
  recompute?: BubbleSetsRecompute;
  recomputeDebounceMs?: number;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface BubbleSetsLayerFormState {
  options: BubbleSetsLayerFields;
}
