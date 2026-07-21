/**
 * `DensityContourFillLayer` — paints filled iso-bands from a
 * d3-contour density estimate over a source `GraphLayer`'s node positions.
 * No outline. For the stroked / Observable-style look, use
 * {@link DensityContourStrokeLayer}; compose both layers (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 */

import type { ContourMultiPolygon } from 'd3-contour';
import type { Graphics } from 'pixi.js';

import { DensityContourLayerBase } from './DensityContourLayerBase';
import { DENSITY_CONTOUR_PALETTES, lerpColor, sampleStops } from './palettes';
import type { DensityContourFillLayerOptions } from './types';

const FILL_DEFAULTS = {
  fillOpacity: 0.4,
  palette: 'blues' as const,
};

function resolveStops(
  palette: DensityContourFillLayerOptions['palette'] | undefined,
): number[] {
  if (Array.isArray(palette)) return palette;
  const name = palette ?? FILL_DEFAULTS.palette;
  return DENSITY_CONTOUR_PALETTES[name] ?? DENSITY_CONTOUR_PALETTES[FILL_DEFAULTS.palette];
}

export class DensityContourFillLayer extends DensityContourLayerBase<DensityContourFillLayerOptions> {
  override readonly kind = 'density-contour-fill-layer';
  protected paintDensity(
    g: Graphics,
    density: ContourMultiPolygon[],
    offsetX: number,
    offsetY: number,
  ): void {
    const opacity = this.options.fillOpacity ?? FILL_DEFAULTS.fillOpacity;
    const total = density.length;
    const colorAt = this.resolveFillColor();

    // d3 returns bands low-density → high-density; paint in that order so
    // denser bands sit on top.
    density.forEach((band, i) => {
      const fillColor = colorAt(band.value, i, total);
      // Each band is a MultiPolygon: an array of polygons; each polygon is
      // an array of rings (outer + holes). For density bands the outer ring
      // is what we want filled; holes are rare and visually subtle, so we
      // paint the outer ring only (PixiJS `Graphics` doesn't expose ring
      // subtraction in v8's path builder).
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
      g.fill({ color: fillColor, alpha: opacity });
    });
  }

  /**
   * Resolve the palette chain into a per-band colour function. Order
   * (most specific wins): {@link DensityContourFillLayerOptions.fillColor}
   * > `paletteFn(t)` > `paletteRangeStart`/`paletteRangeEnd` (both set) >
   * `palette` > default `'blues'`.
   */
  private resolveFillColor(): (value: number, index: number, total: number) => number {
    const o = this.options;
    if (o.fillColor) return o.fillColor;
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
}
