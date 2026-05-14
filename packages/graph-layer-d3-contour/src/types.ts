import type { EventMap } from '@invana/canvas';

import type { DensityContourPaletteName } from './palettes';

/**
 * Options shared by every `DensityContourLayer*` — the d3-contour compute
 * inputs and the recompute lifecycle. Both {@link DensityContourFillLayer}
 * and {@link DensityContourStrokeLayer} extend this; their layer-specific
 * presentation knobs live on their own options interfaces.
 */
export interface DensityContourLayerBaseOptions {
  /**
   * Required. Id of the `GraphLayer` whose node positions feed the density
   * estimate. Per canvas architecture: cross-layer deps are declared
   * explicitly, never inferred.
   */
  graphLayerId: string;

  /**
   * Kernel bandwidth in world units. Larger = smoother / broader blobs.
   * Defaults to `20` (d3's own default).
   */
  bandwidth?: number;

  /**
   * Either a count of iso-bands or an explicit array of iso-values. Defaults
   * to `10`. With a number, d3-contour picks evenly-spaced thresholds across
   * the value range.
   */
  thresholds?: number | number[];

  /**
   * Grid cell size in world units. Smaller = sharper bands but quadratically
   * more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.
   */
  cellSize?: number;

  /**
   * Padding added around the node bounding box before building the grid, so
   * bands at the edge of the cluster aren't clipped against the grid border.
   * World units. Defaults to `50`.
   */
  padding?: number;

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
 * The palette-resolution chain shared by both layers. The fill layer
 * consumes it to colour bands; the stroke layer consumes it when
 * `strokeColor: 'palette'`. Resolution order (most specific wins):
 * `fillColor` callback (fill layer only) > `paletteFn(t)` >
 * `paletteRangeStart`/`paletteRangeEnd` (only when BOTH set) > `palette`
 * (name or stop array) > default `'blues'`.
 */
export interface DensityContourPaletteOptions {
  palette?: DensityContourPaletteName | number[];
  paletteRangeStart?: number;
  paletteRangeEnd?: number;
  paletteFn?: (t: number) => number;
}

/**
 * Options for {@link DensityContourFillLayer}. Paints filled iso-bands and
 * nothing else — no stroke. For an outline-only look use
 * {@link DensityContourStrokeLayer}; compose both layers (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 */
export interface DensityContourFillLayerOptions
  extends DensityContourLayerBaseOptions,
    DensityContourPaletteOptions {
  /**
   * Fully-custom fill colour per band. Receives `(value, index, total)` and
   * returns a `0xRRGGBB` integer. `value` is the iso-value (density);
   * `index` runs 0..total-1 from low-density to high-density. Wins over
   * every other palette option.
   */
  fillColor?: (value: number, index: number, total: number) => number;

  /** Fill alpha 0..1. Defaults to `0.4`. */
  fillOpacity?: number;
}

/**
 * Options for {@link DensityContourStrokeLayer}. Paints iso-line outlines
 * and nothing else — no fill. Defaults match Observable's
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
 * steelblue strokes, every 5th band stroked at 1 unit, the rest at 0.25
 * (the topographic "index contour" pattern).
 */
export interface DensityContourStrokeLayerOptions
  extends DensityContourLayerBaseOptions,
    DensityContourPaletteOptions {
  /**
   * Band outline colour.
   *
   * - `0xRRGGBB` → constant colour for every band. Default `0x4682b4`
   *   (steelblue, Observable's default).
   * - `'palette'` → resolved per band through the palette chain above
   *   ({@link paletteFn} > range > {@link palette}). Use this for the
   *   "rainbow iso-lines" look.
   */
  strokeColor?: number | 'palette';

  /**
   * Band outline width. Either a constant or a per-band function that
   * receives `(index, total, value)` and returns a width in world units.
   *
   * The function form is the most general — useful for any pattern where
   * width depends on `index`. For the canonical topo-map "every Nth line
   * heavy" look, prefer the declarative {@link indexEvery}/
   * {@link indexMajorWidth}/{@link indexMinorWidth} sugar below.
   *
   * Default `0.5`.
   */
  strokeWidth?: number | ((index: number, total: number, value: number) => number);

  /**
   * Index-contour sugar — every `indexEvery`-th band (counting from
   * low-density at `i=0`) is stroked with {@link indexMajorWidth}, all
   * others with {@link indexMinorWidth}. Reproduces the topographic
   * "index contour every N lines" pattern used by Observable's
   * `@d3/density-contours`.
   *
   * Precedence: function-form {@link strokeWidth} wins over the sugar (so
   * callers can opt fully out by setting `strokeWidth` to a callback). The
   * sugar wins over numeric {@link strokeWidth}. All three sugar fields
   * must be set together; partial setups fall back to {@link strokeWidth}.
   *
   * Defaults reproduce Observable's example: `indexEvery: 5`,
   * `indexMajorWidth: 1`, `indexMinorWidth: 0.25`.
   */
  indexEvery?: number;
  indexMajorWidth?: number;
  indexMinorWidth?: number;
}

/**
 * Reserved. Neither layer currently projects user-mutated state — the
 * computed contour data is held as a private field, not in `Layer.state`,
 * because it's bulk geometry that's rebuilt wholesale on each recompute
 * rather than diffed.
 */
export interface DensityContourLayerState {
  readonly _placeholder?: never;
}

export interface DensityContourLayerEvents extends EventMap {
  /** Fired after each recompute completes, before paint. */
  recompute: { thresholds: number; points: number; durationMs: number };
}
