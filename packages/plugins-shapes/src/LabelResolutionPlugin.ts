// ── LabelResolutionPlugin ─────────────────────────────────────────────────────
// Re-rasterizes raster-text labels (PIXI.Text) at higher resolution as the
// camera zooms in, so labels stay sharp without a hard-coded resolution cap.
//
// Opt-in: must be explicitly registered alongside `ShapesPlugin`.  Bitmap
// labels are unaffected (atlas-based, no runtime resolution).

import type { CanvasPlugin, PluginContext } from '@invana/canvas';
import type { ShapesPlugin } from './ShapesPlugin.js';

/**
 * Compute the desired raster resolution for a given camera zoom and device
 * pixel ratio.
 *
 * @param zoom - current camera scale (1 = 100%).
 * @param dpr  - `window.devicePixelRatio` at the time of the call.
 * @returns target resolution multiplier; the plugin will clamp to
 *          `[1, options.maxResolution]`.
 */
export type LabelResolutionResolver = (zoom: number, dpr: number) => number;

/** Construction options for {@link LabelResolutionPlugin}. */
export interface LabelResolutionPluginOptions {
  /** Plugin id.  Default `'label-resolution'`. */
  key?: string;
  /**
   * Required reference to the {@link ShapesPlugin} whose labels will be
   * driven.  Passed explicitly so the dependency is visible at registration
   * time and the plugin doesn't reach into the plugin registry by id.
   */
  shapes: ShapesPlugin;
  /**
   * Custom resolver. Default rounds the target up to the next power of two
   * (`1, 2, 4, 8, …`), which avoids re-rasterising on every tiny zoom delta
   * during pinch.
   */
  resolve?: LabelResolutionResolver;
  /**
   * Hard cap on the resolution multiplier; bounds GPU memory.  Default `8`.
   */
  maxResolution?: number;
  /**
   * Skip re-rasterising when the new resolution differs from the last applied
   * one by less than this absolute amount.  Default `0` (always apply).
   */
  threshold?: number;
  /**
   * Debounce window in milliseconds during continuous zoom.  Default `80`.
   * Set to `0` for synchronous application on every zoom event.
   */
  debounce?: number;
}

const DEFAULT_RESOLVER: LabelResolutionResolver = (zoom, dpr) => {
  const target = Math.max(1, dpr * zoom);
  return Math.pow(2, Math.ceil(Math.log2(target)));
};

/**
 * Behaviour plugin that updates every label's rasterization resolution as the
 * camera zooms.  Per-element {@link LabelStyle.resolution} overrides are
 * preserved — `Label.setResolution` short-circuits when a per-element value
 * is pinned.
 *
 * @example
 * ```ts
 * const shapes  = new ShapesPlugin();
 * const labels  = new LabelResolutionPlugin({ shapes });
 * await canvas.plugins.register(shapes);
 * await canvas.plugins.register(labels);
 * ```
 */
export class LabelResolutionPlugin implements CanvasPlugin {
  readonly id: string;

  private readonly _shapes:        ShapesPlugin;
  private readonly _resolve:       LabelResolutionResolver;
  private readonly _maxResolution: number;
  private readonly _threshold:     number;
  private readonly _debounce:      number;

  private _ctx:        PluginContext | null = null;
  private _lastApplied = -1;
  private _timer:      ReturnType<typeof setTimeout> | null = null;
  private _detachZoom: (() => void) | null = null;

  constructor(options: LabelResolutionPluginOptions) {
    this.id              = options.key           ?? 'label-resolution';
    this._shapes         = options.shapes;
    this._resolve        = options.resolve       ?? DEFAULT_RESOLVER;
    this._maxResolution  = options.maxResolution ?? 8;
    this._threshold      = options.threshold     ?? 0;
    this._debounce       = options.debounce      ?? 80;
  }

  register(ctx: PluginContext): void {
    this._ctx = ctx;

    const onZoom = () => this._schedule();
    ctx.events.on('camera:zoom', onZoom);
    this._detachZoom = () => ctx.events.off('camera:zoom', onZoom);

    // Apply once at startup so labels created before the first zoom event
    // are sized correctly for the current camera.
    this._apply();
  }

  destroy(): void {
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this._detachZoom?.();
    this._detachZoom = null;
    this._ctx = null;
    this._lastApplied = -1;
  }

  /**
   * Force an immediate re-evaluation.  Useful when adding labels in bulk
   * outside of a zoom event, or when the resolver depends on external state
   * that just changed.
   */
  refresh(): void {
    this._apply();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _schedule(): void {
    if (this._debounce <= 0) {
      this._apply();
      return;
    }
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._timer = null;
      this._apply();
    }, this._debounce);
  }

  private _apply(): void {
    if (!this._ctx) return;
    const dpr  = globalThis.devicePixelRatio ?? 1;
    const zoom = this._ctx.camera.scale;
    const raw  = this._resolve(zoom, dpr);
    const r    = Math.min(this._maxResolution, Math.max(1, raw));
    if (Math.abs(r - this._lastApplied) < this._threshold) return;
    this._lastApplied = r;
    this._shapes.forEachLabel((label) => label.setResolution(r));
  }
}
