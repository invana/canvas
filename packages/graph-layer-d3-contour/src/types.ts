import type { EventMap } from '@invana/canvas';

import type { DensityContourPaletteName } from './palettes';

/**
 * Constructor options for {@link DensityContourLayer}.
 *
 * Mirrors the d3-contour `contourDensity()` knobs plus a few rendering
 * controls. All fields are optional except {@link graphLayerId}.
 */
export interface DensityContourLayerOptions {
  /**
   * Required. Id of the `GraphLayer` whose node positions feed the density
   * estimate. Per canvas architecture: cross-layer deps are declared
   * explicitly, never inferred.
   */
  graphLayerId: string;

  /**
   * Kernel bandwidth in world units. Larger = smoother / broader blobs.
   * Defaults to d3's own default of `20`.
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
   * more compute. Defaults to `4`.
   */
  cellSize?: number;

  /**
   * Padding added around the node bounding box before building the grid, so
   * bands at the edge of the cluster aren't clipped against the grid border.
   * World units. Defaults to `50`.
   */
  padding?: number;

  /**
   * Colour ramp for the density bands. Accepts either a built-in palette
   * name (e.g. `'viridis'`) or a custom array of `0xRRGGBB` stops from
   * low-density to high-density. Stops are interpolated to match any
   * threshold count. Defaults to `'blues'`.
   *
   * Beaten by {@link paletteRangeStart}/{@link paletteRangeEnd} (if both
   * set), {@link paletteFn}, and {@link fillColor} (in that order).
   */
  palette?: DensityContourPaletteName | number[];

  /**
   * Two-colour gradient form. When **both** are set, the layer ignores
   * {@link palette} and lerps from `paletteRangeStart` (low density) to
   * `paletteRangeEnd` (high density) across the band count. Convenient for
   * "just blend X to Y" without typing out a stop array.
   *
   * Beaten by {@link paletteFn} and {@link fillColor}.
   */
  paletteRangeStart?: number;
  paletteRangeEnd?: number;

  /**
   * Continuous-function form. Receives a normalised position `t` in
   * `[0, 1]` (0 = lowest-density band, 1 = highest) and returns a
   * `0xRRGGBB` colour. Sampled once per band. Use this for parametric
   * gradients (HSL hue rotation, OkLab mixing, dynamic ramps).
   *
   * Beaten only by {@link fillColor}.
   *
   * @example
   * paletteFn: (t) => {
   *   const hue = 220 - t * 180; // blue → green → yellow
   *   return hslToHex(hue, 0.7, 0.5);
   * }
   */
  paletteFn?: (t: number) => number;

  /**
   * Fully-custom fill colour per band. Receives `(value, index, total)` and
   * returns a `0xRRGGBB` integer. `value` is the iso-value (density);
   * `index` runs 0..total-1 from low-density to high-density. Wins over
   * every other palette option.
   */
  fillColor?: (value: number, index: number, total: number) => number;

  /** Fill alpha 0..1. Defaults to `0.4`. */
  fillOpacity?: number;

  /**
   * Band outline colour.
   *
   * - A `0xRRGGBB` number → constant stroke colour for every band (default
   *   `0x000000`, only visible when {@link strokeWidth} `> 0`).
   * - The literal string `'palette'` → stroke colour for each band is
   *   resolved through the same palette chain as the fill (`fillColor` >
   *   `paletteFn` > `paletteRangeStart`/`paletteRangeEnd` > `palette`).
   *   Use this to reproduce the classic d3 density-contour look (e.g. the
   *   Observable `@d3/density-contours` example) where each iso-line is
   *   tinted by the density ramp without any fill.
   */
  strokeColor?: number | 'palette';

  /** Optional band outline width. Default `0`. */
  strokeWidth?: number;

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
 * Reserved. The layer doesn't currently project user-mutated state — the
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
