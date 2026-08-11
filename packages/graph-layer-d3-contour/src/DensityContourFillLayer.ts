/**
 * `DensityContourFillLayer` — paints filled iso-bands from a
 * d3-contour density estimate over a source `GraphLayer`'s node positions.
 * No outline. For the stroked / Observable-style look, use
 * {@link DensityContourStrokeLayer}; compose both layers (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 */

import type { ContourMultiPolygon } from 'd3-contour';

import type { PathSpec } from '@invana/canvas/specs';
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
  protected buildBands(
    density: ContourMultiPolygon[],
    offsetX: number,
    offsetY: number,
  ): PathSpec[] {
    const opacity = this.options.fillOpacity ?? FILL_DEFAULTS.fillOpacity;
    const total = density.length;
    const colorAt = this.resolveFillColor();
    const out: PathSpec[] = [];

    // d3 returns bands low-density → high-density; emit in that order so denser
    // bands sit on top.
    density.forEach((band, i) => {
      const fillColor = colorAt(band.value, i, total);
      // Each band is a MultiPolygon: polygons of rings (outer + holes). The outer
      // ring is what we fill; holes are rare and visually subtle here.
      for (const polygon of band.coordinates) {
        const outer = polygon[0];
        if (!outer || outer.length < 3) continue;
        out.push({
          kind: 'path',
          x: 0,
          y: 0,
          closed: true,
          points: outer.map((pt) => ({ x: (pt[0] ?? 0) + offsetX, y: (pt[1] ?? 0) + offsetY })),
          fill: [{ kind: 'solid', color: fillColor, alpha: opacity }],
        });
      }
    });
    return out;
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
