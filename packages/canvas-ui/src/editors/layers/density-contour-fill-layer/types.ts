/**
 * Types for the DensityContourFillLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-d3-contour` (home of
 * `DensityContourFillLayer` and its options) is **not** imported — canvas-ui
 * may only use `@invana/graph` types (package CLAUDE.md). The editable option
 * shape is mirrored here as {@link DensityContourFillLayerOptions}, a
 * serialisable patch the consumer applies via `setOptions`. Keep the enums /
 * fields in sync with the engine by hand.
 */

/**
 * Named colour ramp for the density bands. Mirrors the engine's
 * `DensityContourPaletteName`. The engine also accepts a raw stop array; that
 * non-scalar form is out of scope for this select and round-trips untouched.
 */
export type DensityContourPaletteName =
  | 'blues'
  | 'greens'
  | 'oranges'
  | 'purples'
  | 'reds'
  | 'viridis'
  | 'plasma'
  | 'magma'
  | 'inferno'
  | 'warm'
  | 'cool';

/** Recompute trigger — `'auto'` debounces on source changes; `'manual'` is caller-driven. */
export type DensityContourRecompute = 'auto' | 'manual';

/**
 * The subset of `DensityContourFillLayerOptions` this editor produces — a
 * serialisable patch. The `graphLayerId` cross-layer identity, the `fillColor`
 * per-band callback, and the `paletteFn` callback are out of scope (identity /
 * function options). `thresholds` keeps only the scalar band-count form; the
 * explicit iso-value array is out of scope.
 */
export interface DensityContourFillLayerOptions {
  /** Kernel bandwidth in world units. Larger = smoother / broader blobs. */
  bandwidth?: number;
  /** Band count (scalar `thresholds` form). */
  thresholds?: number;
  /** Grid cell size in world units (d3 requires a power of two). */
  cellSize?: number;
  /** Padding around the node bounding box before building the grid. */
  padding?: number;
  /** Named colour ramp for the bands. */
  palette?: DensityContourPaletteName;
  /** Palette start fraction 0..1 (used only when both start + end set). */
  paletteRangeStart?: number;
  /** Palette end fraction 0..1 (used only when both start + end set). */
  paletteRangeEnd?: number;
  /** Fill alpha 0..1. Default `0.4`. */
  fillOpacity?: number;
  /** Recompute trigger. */
  recompute?: DensityContourRecompute;
  /** Debounce window for `auto` recomputes, in ms. */
  recomputeDebounceMs?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Matches
 * {@link DensityContourFillLayerOptions} 1:1 — every option is already a scalar
 * (no nested groups, no colour numbers), so no re-encoding is needed.
 */
export type DensityContourFillLayerFields = DensityContourFillLayerOptions;

/** react-hook-form state — leaves register under `options.<field>`. */
export interface DensityContourFillLayerFormState {
  options: DensityContourFillLayerFields;
}
