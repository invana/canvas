/**
 * `LabelResolutionLODBehaviour` — re-rasterise label glyphs at higher
 * resolution as the camera zooms in, so text stays crisp instead of
 * sampling-blurry when the user inspects nodes up close.
 *
 * Mechanism: Pixi rasterises a `Text` to a glyph texture exactly once
 * (default resolution = renderer DPR). When the world container is scaled
 * 5×, that texture is upsampled 5× — fuzzy. This behaviour watches
 * `camera:zoom` and pushes `effectiveDpr × zoom` into
 * `PrimitivesRenderer.setLabelsResolution`, which re-rasterises every
 * label decoration at the new fidelity.
 *
 * Snapping: regenerating a glyph texture per wheel tick is expensive
 * (GPU upload + texture allocation), so the behaviour snaps the zoom to
 * a configurable `step` (default `0.5`) before computing the resolution.
 * A pinch from 1.0 → 1.4 stays at the same texture; crossing 1.5 triggers
 * a single re-raster. Combined with the `min` / `max` clamp this keeps
 * memory bounded — at `max: 8` a 12px label texture caps around 96 dp,
 * easily within budget for thousands of nodes.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches
 * the project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new LabelResolutionLODBehaviour({
 *     id: 'label-resolution',
 *     layerId: 'graph',
 *     enabled: true,
 *     // optional tuning
 *     max: 6,         // cap at 6× DPR — covers up to ~6× zoom sharply
 *     step: 0.5,      // snap zoom to nearest 0.5 before re-rastering
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

export interface LabelResolutionLODBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  layerId: string;

  /**
   * Base resolution to multiply the zoom by. Default `window.devicePixelRatio`
   * (≈ 1 on standard displays, 2 on retina). Set this if your Canvas was
   * initialised with a custom `resolution` option and you want labels to
   * match that baseline at zoom 1.
   */
  baseResolution?: number;

  /**
   * Minimum applied resolution as a multiple of `baseResolution`. Labels
   * never drop below this even when zoomed out. Default `1` (always at
   * least native DPR).
   */
  min?: number;

  /**
   * Maximum applied resolution as a multiple of `baseResolution`. Caps the
   * memory cost — a label texture at 8× retina is already ≈ 16× the byte
   * count of a baseline texture, beyond which gains are imperceptible.
   * Default `8`.
   */
  max?: number;

  /**
   * Zoom snap-step before computing the resolution. Avoids retexturing on
   * every wheel tick. Default `0.5` (re-rasters at zoom 1.0, 1.5, 2.0, …).
   */
  step?: number;
}

interface ResolvedOptions {
  baseResolution: number;
  min: number;
  max: number;
  step: number;
}

export class LabelResolutionLODBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private readonly opts: ResolvedOptions;
  private subs: Array<() => void> = [];
  /**
   * Last resolution actually pushed to the renderer. Tracked so onDisable
   * can decide whether a baseline-restore is needed, and so we skip a
   * push when the snapped value is unchanged.
   */
  private lastPushed: number | null = null;

  constructor(opts: LabelResolutionLODBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    const baseResolution =
      opts.baseResolution ??
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ??
      1;
    this.opts = {
      baseResolution,
      min: opts.min ?? 1,
      max: opts.max ?? 8,
      step: opts.step ?? 0.5,
    };
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `LabelResolutionLODBehaviour "${this.id}": layer "${this.layerId}" not found.`,
      );
    }
    this.layer = layer;

    const onCameraZoom = (): void => this.apply();
    ctx.events.on('camera:zoom', onCameraZoom);
    this.subs.push(() => ctx.events.off('camera:zoom', onCameraZoom));

    // Re-apply on layer data churn — newly added labels mount with the
    // renderer's tracked resolution automatically, but a one-shot push
    // here keeps the path predictable when the developer toggles the
    // behaviour off then back on after a data swap.
    const offFlush = layer.store.events.on('flush', () => this.apply());
    this.subs.push(offFlush);

    if (this.enabled) this.apply();
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.lastPushed = null;
  }

  protected override onEnable(): void {
    this.apply();
  }

  protected override onDisable(): void {
    // Restore baseline so disabling the behaviour doesn't leave labels
    // stuck at a stale high resolution.
    const renderer = this.layer?.getRenderer();
    if (renderer) renderer.setLabelsResolution(this.opts.baseResolution);
    this.lastPushed = this.opts.baseResolution;
  }

  /** Push the current camera-snapped resolution to the renderer. */
  private apply(): void {
    if (!this.enabled) return;
    const renderer = this.layer?.getRenderer();
    if (!renderer || !this.ctx) return;
    const zoom = this.ctx.camera.scale;
    const snapped = snapZoom(zoom, this.opts.step);
    const next = clamp(snapped, this.opts.min, this.opts.max) * this.opts.baseResolution;
    if (this.lastPushed !== null && Math.abs(this.lastPushed - next) < 1e-6) return;
    this.lastPushed = next;
    renderer.setLabelsResolution(next);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Snap `zoom` *up* to the next multiple of `step`. */
function snapZoom(zoom: number, step: number): number {
  if (step <= 0) return zoom;
  return Math.ceil(zoom / step) * step;
}
