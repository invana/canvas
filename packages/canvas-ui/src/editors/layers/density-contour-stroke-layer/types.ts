/**
 * Types for the DensityContourStrokeLayer editor.
 *
 * Engine-agnostic: `@invana/graph-layer-d3-contour` (home of
 * `DensityContourStrokeLayer` and its options) is **not** imported — canvas-ui
 * may only use `@invana/graph` types (package CLAUDE.md). The editable option
 * shape is mirrored here as {@link DensityContourStrokeLayerOptions}, a
 * serialisable patch the consumer applies via `setOptions`. Keep the enums /
 * fields in sync with the engine by hand.
 */

/**
 * Named colour ramp for the iso-lines. Mirrors the engine's
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
 * The subset of `DensityContourStrokeLayerOptions` this editor produces — a
 * serialisable patch. The `graphLayerId` cross-layer identity and the
 * `paletteFn` callback are out of scope. `strokeColor` keeps the engine's
 * `number (0xRRGGBB) | 'palette'` encoding (a constant colour or per-band
 * palette resolution); `strokeWidth` keeps only its scalar constant form (the
 * per-band width callback is out of scope). `thresholds` keeps only the scalar
 * band-count form.
 */
export interface DensityContourStrokeLayerOptions {
  /** Kernel bandwidth in world units. Larger = smoother / broader blobs. */
  bandwidth?: number;
  /** Band count (scalar `thresholds` form). */
  thresholds?: number;
  /** Grid cell size in world units (d3 requires a power of two). */
  cellSize?: number;
  /** Padding around the node bounding box before building the grid. */
  padding?: number;
  /** Named colour ramp — consulted when `strokeColor === 'palette'`. */
  palette?: DensityContourPaletteName;
  /** Palette start fraction 0..1 (used only when both start + end set). */
  paletteRangeStart?: number;
  /** Palette end fraction 0..1 (used only when both start + end set). */
  paletteRangeEnd?: number;
  /**
   * Iso-line colour: a constant `0xRRGGBB` integer, or `'palette'` to resolve
   * per band through the palette chain.
   */
  strokeColor?: number | 'palette';
  /** Constant iso-line width in world units. */
  strokeWidth?: number;
  /** Index-contour sugar — every Nth band is stroked with the major width. */
  indexEvery?: number;
  /** Width of the "major" (index) contours. */
  indexMajorWidth?: number;
  /** Width of the "minor" (in-between) contours. */
  indexMinorWidth?: number;
  /** Recompute trigger. */
  recompute?: DensityContourRecompute;
  /** Debounce window for `auto` recomputes, in ms. */
  recomputeDebounceMs?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `strokeColor: number | 'palette'` union is split into a `strokePalette`
 * boolean toggle plus a `strokeColor` colour string (see `mapping.ts`), because
 * a single field can't be both a swatch and a mode.
 */
export interface DensityContourStrokeLayerFields {
  bandwidth?: number;
  thresholds?: number;
  cellSize?: number;
  padding?: number;
  palette?: DensityContourPaletteName;
  paletteRangeStart?: number;
  paletteRangeEnd?: number;
  /** Whether the iso-lines are coloured from the palette (vs a constant swatch). */
  strokePalette?: boolean;
  /** Constant iso-line colour `#rrggbb`, used only when {@link strokePalette} is off. */
  strokeColor?: string;
  strokeWidth?: number;
  indexEvery?: number;
  indexMajorWidth?: number;
  indexMinorWidth?: number;
  recompute?: DensityContourRecompute;
  recomputeDebounceMs?: number;
}

/** react-hook-form state — leaves register under `options.<field>`. */
export interface DensityContourStrokeLayerFormState {
  options: DensityContourStrokeLayerFields;
}
