/**
 * `DensityContourLayerBase` — abstract `WorldLayer` that owns the
 * d3-contour density compute and recompute lifecycle. Concrete subclasses
 * decide *how* the resulting iso-bands are painted: filled
 * ({@link DensityContourFillLayer}) or stroked
 * ({@link DensityContourStrokeLayer}).
 *
 * The compute lives in world space so iso-bands track the source graph as
 * the camera pans and zooms. Recompute is debounced (default 120 ms) and
 * triggered by the source `GraphLayer`'s `data:changed`. `contourDensity`
 * is O(n · grid²), so per-frame recompute during drag would tank perf —
 * set `recompute: 'manual'` and call `layer.recompute()` from a drag
 * behaviour if you need that.
 *
 * Subclasses implement {@link paintDensity} to render the
 * `ContourMultiPolygon[]` into the layer's `Graphics`. All shared state
 * (subscription, debounce timer, bounds math) is owned here.
 */

import { WorldLayer } from '@invana/canvas';
import type { CanvasContext, LayerOptions, WorldLayerHit } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';
import { contourDensity, type ContourMultiPolygon } from 'd3-contour';
import type { Graphics } from 'pixi.js';

import type {
  DensityContourLayerBaseOptions,
  DensityContourLayerEvents,
  DensityContourLayerState,
} from './types';

export const DENSITY_CONTOUR_BASE_DEFAULTS = {
  bandwidth: 20,
  thresholds: 10 as number | number[],
  cellSize: 4,
  padding: 50,
  recompute: 'auto' as 'auto' | 'manual',
  recomputeDebounceMs: 120,
} as const;

export abstract class DensityContourLayerBase<
  TOpt extends DensityContourLayerBaseOptions,
  TEvt extends DensityContourLayerEvents = DensityContourLayerEvents,
> extends WorldLayer<TOpt, DensityContourLayerState, TEvt, never, WorldLayerHit> {
  private readonly graphLayerId: string;

  private graph: GraphLayer | null = null;
  protected gfx: Graphics | null = null;
  private readonly subs: Array<() => void> = [];

  // Browser `setTimeout` returns `number`; using `ReturnType<typeof setTimeout>`
  // would resolve to NodeJS.Timeout in dual-typed environments and break the
  // `window.clearTimeout(...)` call site.
  private debounceTimer: number | null = null;

  constructor(opts: LayerOptions<TOpt>) {
    super({
      ...opts,
      // Density bands extend past node centres by `bandwidth + padding`, so
      // viewport culling against the bare node AABB would clip them.
      cullable: opts.cullable ?? false,
      // Passive overlay — clicks fall through to the graph below.
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
        `${this.constructor.name} "${this.id}": graph layer "${this.graphLayerId}" not found. ` +
          `Add the GraphLayer before this contour layer.`,
      );
    }
    this.graph = graph;
    this.gfx = this.createGraphics('density-bands');

    const recompute = this.options.recompute ?? DENSITY_CONTOUR_BASE_DEFAULTS.recompute;
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
   * Apply a config patch — the seam `canvas.update({ layers: { [id]: … } })`
   * (and therefore the settings editors + the React wrapper) drives. Merges
   * over the current options and repaints, so appearance fields (`bandwidth`,
   * `thresholds`, `cellSize`, `padding`, the subclass's fill / stroke fields)
   * are live-editable.
   *
   * `graphLayerId` is identity, not appearance — it's read once on mount, so
   * patching it here has no effect; re-add the layer to retarget it.
   */
  setOptions(patch: Partial<TOpt>): void {
    // `options` is declared readonly on the base `Layer` (construction-time
    // config); mutate in place rather than reassigning so every reader —
    // including the in-flight paint — sees one object.
    Object.assign(this.options, patch);
    this.scheduleRecompute();
  }

  /**
   * Force an immediate recompute — e.g. in `recompute: 'manual'` mode, or after
   * a layout moved node positions without changing the data.
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
    const wait =
      this.options.recomputeDebounceMs ?? DENSITY_CONTOUR_BASE_DEFAULTS.recomputeDebounceMs;
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

    // Collect node positions in world coords. d3-contour wants its grid in
    // a local positive-quadrant space, so we offset by (minX, minY) before
    // feeding points in and add the offset back when painting.
    const points: Array<{ x: number; y: number }> = [];
    for (const node of graph.store.nodes()) {
      const p = node.position;
      if (!p) continue;
      points.push({ x: p.x, y: p.y });
    }

    g.clear();

    if (points.length === 0) return;

    const pad = this.options.padding ?? DENSITY_CONTOUR_BASE_DEFAULTS.padding;
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
      .bandwidth(this.options.bandwidth ?? DENSITY_CONTOUR_BASE_DEFAULTS.bandwidth)
      .thresholds(this.options.thresholds ?? DENSITY_CONTOUR_BASE_DEFAULTS.thresholds)
      .cellSize(this.options.cellSize ?? DENSITY_CONTOUR_BASE_DEFAULTS.cellSize)(points);

    this.paintDensity(g, density, minX, minY);

    // `recompute` is part of the base event contract — subclass event maps
    // must extend `DensityContourLayerEvents`, so this emit is always
    // type-correct. The cast bridges the generic TEvt to the literal
    // event name.
    (this.events.emit as (k: 'recompute', p: DensityContourLayerEvents['recompute']) => void)(
      'recompute',
      {
        thresholds: density.length,
        points: points.length,
        durationMs: performance.now() - t0,
      },
    );
  }

  /**
   * Render the iso-bands into `g`. The bands are ordered low-density →
   * high-density; subclasses typically paint in that order so denser bands
   * sit on top. `offsetX`/`offsetY` are the world-space origin of the
   * compute grid — add them to each polygon point.
   */
  protected abstract paintDensity(
    g: Graphics,
    density: ContourMultiPolygon[],
    offsetX: number,
    offsetY: number,
  ): void;
}
