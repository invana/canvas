/**
 * `DensityContourStrokeLayer` — paints stroked iso-lines from a
 * d3-contour density estimate over a source `GraphLayer`'s node positions.
 * No fill. Defaults reproduce Observable's
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
 * steelblue strokes with the topographic "index contour" pattern (every 5th
 * band heavy at 1 unit, the rest hair-thin at 0.25).
 *
 * For filled iso-bands use {@link DensityContourFillLayer}; compose both
 * layers (same `graphLayerId`, different `zIndex`) for fill + outline
 * together.
 */

import type { ContourMultiPolygon } from 'd3-contour';
import type { Graphics } from 'pixi.js';

import { DensityContourLayerBase } from './DensityContourLayerBase';
import { DENSITY_CONTOUR_PALETTES, lerpColor, sampleStops } from './palettes';
import type { DensityContourStrokeLayerOptions } from './types';

const STROKE_DEFAULTS = {
  strokeColor: 0x4682b4, // steelblue — Observable's default
  strokeWidth: 0.5,
  palette: 'blues' as const,
};

function resolveStops(
  palette: DensityContourStrokeLayerOptions['palette'] | undefined,
): number[] {
  if (Array.isArray(palette)) return palette;
  const name = palette ?? STROKE_DEFAULTS.palette;
  return DENSITY_CONTOUR_PALETTES[name] ?? DENSITY_CONTOUR_PALETTES[STROKE_DEFAULTS.palette];
}

export class DensityContourStrokeLayer extends DensityContourLayerBase<DensityContourStrokeLayerOptions> {
  override readonly kind = 'density-contour-stroke-layer';
  protected paintDensity(
    g: Graphics,
    density: ContourMultiPolygon[],
    offsetX: number,
    offsetY: number,
  ): void {
    const total = density.length;
    const widthAt = this.resolveWidth();
    const strokeAt = this.resolveStrokeColor();

    density.forEach((band, i) => {
      const w = widthAt(i, total, band.value);
      if (w <= 0) return; // skip; nothing to paint for this band

      for (const polygon of band.coordinates) {
        const outer = polygon[0];
        if (!outer || outer.length < 3) continue;
        const flat: number[] = new Array(outer.length * 2);
        for (let k = 0; k < outer.length; k++) {
          const pt = outer[k]!;
          flat[k * 2] = (pt[0] ?? 0) + offsetX;
          flat[k * 2 + 1] = (pt[1] ?? 0) + offsetY;
        }
        g.poly(flat);
      }
      g.stroke({ color: strokeAt(band.value, i, total), width: w });
    });
  }

  /**
   * Resolve the per-band stroke-width function. Precedence:
   *   1. `strokeWidth` is a function → use it directly.
   *   2. All three index-contour sugar fields set → build
   *      `(i) => i % every === 0 ? major : minor`.
   *   3. `strokeWidth` is a number → constant.
   *   4. Default {@link STROKE_DEFAULTS.strokeWidth}.
   */
  private resolveWidth(): (index: number, total: number, value: number) => number {
    const o = this.options;
    if (typeof o.strokeWidth === 'function') return o.strokeWidth;

    if (
      o.indexEvery !== undefined &&
      o.indexMajorWidth !== undefined &&
      o.indexMinorWidth !== undefined
    ) {
      const every = o.indexEvery;
      const major = o.indexMajorWidth;
      const minor = o.indexMinorWidth;
      return (i) => (i % every === 0 ? major : minor);
    }

    const w = typeof o.strokeWidth === 'number' ? o.strokeWidth : STROKE_DEFAULTS.strokeWidth;
    return () => w;
  }

  /**
   * Resolve the per-band stroke-colour function. When `strokeColor` is
   * `'palette'`, walk the palette chain (`paletteFn` > range > `palette`);
   * otherwise return a constant colour function. Default is steelblue.
   */
  private resolveStrokeColor(): (value: number, index: number, total: number) => number {
    const o = this.options;
    const sc = o.strokeColor;

    if (sc === 'palette') {
      if (o.paletteFn) {
        const fn = o.paletteFn;
        return (_v, i, n) => fn(n > 1 ? i / (n - 1) : 0);
      }
      if (o.paletteRangeStart !== undefined && o.paletteRangeEnd !== undefined) {
        const a = o.paletteRangeStart;
        const b = o.paletteRangeEnd;
        return (_v, i, n) => lerpColor(a, b, n > 1 ? i / (n - 1) : 0);
      }
      const stops = resolveStops(o.palette);
      return (_v, i, n) => sampleStops(stops, i, n);
    }

    const c = typeof sc === 'number' ? sc : STROKE_DEFAULTS.strokeColor;
    return () => c;
  }
}
