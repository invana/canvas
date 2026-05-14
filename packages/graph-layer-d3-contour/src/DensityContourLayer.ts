/**
 * `DensityContourLayer` — a `WorldLayer` that paints `d3-contour`'s
 * density-estimate iso-bands over a source `GraphLayer`'s node positions.
 *
 * Lives in world space so the contour tracks the graph as the camera pans
 * and zooms. Toggle the overlay by adding / removing the layer, or by
 * flipping `layer.visible`.
 *
 * Recompute strategy (default): subscribe to the source layer's
 * `data:changed` and recompute on a 120 ms debounce. `contourDensity` is
 * O(n · grid²), so per-frame recompute during drag would tank perf — set
 * `recompute: 'manual'` and call `layer.recompute()` from a drag behaviour
 * if you need that.
 */

import { WorldLayer } from '@invana/canvas';
import type { CanvasContext, LayerOptions, WorldLayerHit } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';
import { contourDensity, type ContourMultiPolygon } from 'd3-contour';
import type { Graphics } from 'pixi.js';

import { DENSITY_CONTOUR_PALETTES, lerpColor, sampleStops } from './palettes';
import type {
  DensityContourLayerEvents,
  DensityContourLayerOptions,
  DensityContourLayerState,
} from './types';

const DEFAULTS = {
  bandwidth: 20,
  thresholds: 10 as number | number[],
  cellSize: 4,
  padding: 50,
  fillOpacity: 0.4,
  strokeColor: 0x000000,
  strokeWidth: 0,
  recompute: 'auto' as 'auto' | 'manual',
  recomputeDebounceMs: 120,
  palette: 'blues' as const,
};

/** Resolve the active stop array for a given palette option value. */
function resolveStops(
  palette: DensityContourLayerOptions['palette'] | undefined,
): number[] {
  if (Array.isArray(palette)) return palette;
  const name = palette ?? DEFAULTS.palette;
  return DENSITY_CONTOUR_PALETTES[name] ?? DENSITY_CONTOUR_PALETTES[DEFAULTS.palette];
}

export class DensityContourLayer extends WorldLayer<
  DensityContourLayerOptions,
  DensityContourLayerState,
  DensityContourLayerEvents,
  never,
  WorldLayerHit
> {
  private readonly graphLayerId: string;

  private graph: GraphLayer | null = null;
  private gfx: Graphics | null = null;
  private readonly subs: Array<() => void> = [];

  // Browser setTimeout returns `number`; using `ReturnType<typeof setTimeout>`
  // would resolve to NodeJS.Timeout in dual-typed environments and break the
  // `window.clearTimeout(...)` call site.
  private debounceTimer: number | null = null;

  constructor(opts: LayerOptions<DensityContourLayerOptions>) {
    super({
      ...opts,
      // Density bands extend past node centres by `bandwidth + padding`, so
      // viewport culling against the bare node AABB would clip them. Default
      // off; caller can override.
      cullable: opts.cullable ?? false,
      // Passive overlay — clicks should fall through to the graph below.
      hittable: opts.hittable ?? false,
    });
    this.graphLayerId = opts.options.graphLayerId;
  }

  protected createState(): DensityContourLayerState {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    const graph = ctx.layers.get<GraphLayer>(this.graphLayerId);
    if (!graph) {
      throw new Error(
        `DensityContourLayer "${this.id}": graph layer "${this.graphLayerId}" not found. ` +
          `Add the GraphLayer before DensityContourLayer.`,
      );
    }
    this.graph = graph;
    this.gfx = this.createGraphics('density-bands');

    const recompute = this.options.recompute ?? DEFAULTS.recompute;
    if (recompute === 'auto') {
      this.subs.push(graph.events.on('data:changed', () => this.scheduleRecompute()));
    }

    // Initial paint — the graph may already hold data when we mount.
    this.scheduleRecompute();
  }

  protected override onUnmount(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.gfx = null;
    this.graph = null;
  }

  /**
   * Force an immediate recompute. Useful in `recompute: 'manual'` mode, or to
   * refresh the overlay after externally mutating options that don't have
   * setters yet.
   */
  recompute(): void {
    this.computeAndPaint();
  }

  hitTest(_worldX: number, _worldY: number): WorldLayerHit | null {
    return null;
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private scheduleRecompute(): void {
    if (this.debounceTimer !== null) window.clearTimeout(this.debounceTimer);
    const wait = this.options.recomputeDebounceMs ?? DEFAULTS.recomputeDebounceMs;
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.computeAndPaint();
    }, wait);
  }

  private computeAndPaint(): void {
    const g = this.gfx;
    const graph = this.graph;
    if (!g || !graph) return;

    const t0 = performance.now();

    // Collect node positions in world coords. d3-contour wants its grid in a
    // local positive-quadrant space, so we offset by (minX, minY) before
    // feeding points in and add the offset back when painting.
    const points: Array<{ x: number; y: number }> = [];
    for (const node of graph.store.nodes()) {
      const p = node.position;
      if (!p) continue;
      points.push({ x: p.x, y: p.y });
    }

    g.clear();

    if (points.length === 0) return;

    const pad = this.options.padding ?? DEFAULTS.padding;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    const width = Math.max(1, Math.ceil(maxX - minX));
    const height = Math.max(1, Math.ceil(maxY - minY));

    const density: ContourMultiPolygon[] = contourDensity<{ x: number; y: number }>()
      .x((d) => d.x - minX)
      .y((d) => d.y - minY)
      .size([width, height])
      .bandwidth(this.options.bandwidth ?? DEFAULTS.bandwidth)
      .thresholds(this.options.thresholds ?? DEFAULTS.thresholds)
      .cellSize(this.options.cellSize ?? DEFAULTS.cellSize)(points);

    this.paintBands(g, density, minX, minY);

    this.events.emit('recompute', {
      thresholds: density.length,
      points: points.length,
      durationMs: performance.now() - t0,
    });
  }

  private paintBands(
    g: Graphics,
    density: ContourMultiPolygon[],
    offsetX: number,
    offsetY: number,
  ): void {
    const opacity = this.options.fillOpacity ?? DEFAULTS.fillOpacity;
    const strokeWidth = this.options.strokeWidth ?? DEFAULTS.strokeWidth;
    const strokeColorOpt = this.options.strokeColor;
    const total = density.length;

    // Palette resolution order (most specific wins):
    //   `fillColor` callback
    //   > `paletteFn(t)`
    //   > `paletteRangeStart`/`paletteRangeEnd` (only when BOTH are set)
    //   > `palette` (name or array of stops)
    //   > default `'blues'` palette.
    // Resolved once per paint so callers can hot-swap any of these at
    // runtime without re-constructing the layer. Returns a per-band colour
    // function reused for both fill and stroke (when stroke opts into the
    // palette via `strokeColor: 'palette'`).
    const o = this.options;
    let paletteColor: (value: number, index: number, total: number) => number;
    if (o.fillColor) {
      paletteColor = o.fillColor;
    } else if (o.paletteFn) {
      const fn = o.paletteFn;
      paletteColor = (_v, i, n) => fn(n > 1 ? i / (n - 1) : 0);
    } else if (o.paletteRangeStart !== undefined && o.paletteRangeEnd !== undefined) {
      const a = o.paletteRangeStart;
      const b = o.paletteRangeEnd;
      paletteColor = (_v, i, n) => lerpColor(a, b, n > 1 ? i / (n - 1) : 0);
    } else {
      const stops = resolveStops(o.palette);
      paletteColor = (_v, i, n) => sampleStops(stops, i, n);
    }

    // Stroke colour: constant number, palette-resolved per band, or the
    // default constant black when unset.
    const strokeAt: (value: number, index: number, total: number) => number =
      strokeColorOpt === 'palette'
        ? paletteColor
        : typeof strokeColorOpt === 'number'
          ? () => strokeColorOpt
          : () => DEFAULTS.strokeColor;

    // d3 returns bands ordered low-density → high-density; that's the order
    // we paint in so higher-density bands sit on top.
    density.forEach((band, i) => {
      const fillColor = paletteColor(band.value, i, total);
      // Each band is a MultiPolygon: an array of polygons; each polygon is an
      // array of rings (outer + holes). For density bands, the outer ring is
      // what we want filled; holes are rare and visually subtle, so we paint
      // the outer ring only for now (PixiJS `Graphics` doesn't expose ring
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
      if (strokeWidth > 0) {
        g.stroke({ color: strokeAt(band.value, i, total), width: strokeWidth });
      }
    });
  }
}
