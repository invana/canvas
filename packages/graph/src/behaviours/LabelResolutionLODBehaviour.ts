/**
 * `LabelResolutionLODBehaviour` — re-rasterise label glyphs at higher
 * resolution as the camera zooms in, so text stays crisp instead of
 * sampling-blurry when the user inspects nodes up close.
 *
 * **Why this is tier-based, not step-based.** Pixi rasterises each `Text`
 * to a glyph texture exactly once (default resolution = renderer DPR).
 * When the world is scaled 5×, that texture is upsampled 5× — fuzzy.
 * Re-rasterising fixes the fuzziness but regenerates every label's
 * texture on the GPU, which is the expensive part. With a few thousand
 * labels (e.g. the H-1B pack story) a re-raster is a multi-hundred-ms
 * frame pause — perceptible as a stutter mid-zoom.
 *
 * An earlier design snapped the zoom to a step (e.g. `step: 0.5`) and
 * re-rastered at every snap boundary — so a continuous zoom from 1× to
 * 6× crossed ~10 boundaries and dropped frames at each one. This design
 * uses **discrete tiers**: a few widely-spaced minZoom thresholds, with
 * a multiplier per tier. In a typical zoom-in-and-stay session the user
 * crosses one boundary, pays one re-raster, and the rest is GPU-cheap.
 *
 * **Hysteresis** keeps boundary scrolls (1.49 → 1.51 → 1.49) from
 * flickering between tiers. After crossing UP into tier N, the behaviour
 * only reverts to tier N-1 when zoom drops below
 * `levels[N].minZoom - hysteresis`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches
 * the project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new LabelResolutionLODBehaviour({
 *     id: 'label-resolution',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     // Defaults: 1× DPR by default, jump to 4× DPR once zoom > 1.5.
 *     // Override for more or fewer tiers.
 *     levels: [
 *       { minZoom: 0,   multiplier: 1 },
 *       { minZoom: 1.5, multiplier: 4 },
 *       { minZoom: 5,   multiplier: 8 },
 *     ],
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** One discrete LOD tier. Highest `minZoom` ≤ current zoom wins. */
export interface LabelResolutionLODTier {
  /** Camera zoom (`canvas.camera.scale`) at which this tier becomes active. */
  minZoom: number;
  /** Multiplier applied to `baseResolution` while this tier is active. */
  multiplier: number;
}

export interface LabelResolutionLODBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;

  /**
   * Base resolution to multiply by the active tier's multiplier. Default
   * `window.devicePixelRatio` (≈ 1 on standard displays, 2 on retina). Set
   * this if your Canvas was initialised with a custom `resolution` option.
   */
  baseResolution?: number;

  /**
   * Discrete zoom tiers, evaluated as a step function. Each tier names a
   * `minZoom` at which it activates and a `multiplier` applied to
   * `baseResolution` while it's active. Order doesn't matter — the
   * behaviour sorts by `minZoom` internally.
   *
   * Pick *few, widely-spaced* tiers: every additional tier means another
   * GPU re-raster of every label during a typical zoom-in pass. Default:
   * `[{ minZoom: 0, multiplier: 1 }, { minZoom: 1.5, multiplier: 4 }]` —
   * one threshold, one re-raster.
   */
  levels?: LabelResolutionLODTier[];

  /**
   * Hysteresis applied to *downward* tier changes. After crossing UP into
   * tier N at `levels[N].minZoom`, the behaviour only reverts to tier N-1
   * once zoom drops below `levels[N].minZoom - hysteresis`. Prevents
   * flicker when the user dithers on a threshold. Default `0.1`.
   */
  hysteresis?: number;
}

interface ResolvedOptions {
  baseResolution: number;
  /** Sorted ascending by `minZoom`. Guaranteed non-empty. */
  levels: LabelResolutionLODTier[];
  hysteresis: number;
}

const DEFAULT_LEVELS: LabelResolutionLODTier[] = [
  // Each tier covers a ~2.5× zoom band so sampling stays ≥ ~1px-per-glyph-
  // px through the whole zoom range. The math: at zoom Z with multiplier M
  // and DPR=2, glyph-texture sampling per displayed pixel = (M * 2) / Z.
  // Aim for ≥ 1 to keep text crisp. So multiplier ≈ Z / 2.
  { minZoom: 0, multiplier: 1 },     // 0 – 1.5×: native DPR
  { minZoom: 1.5, multiplier: 4 },   // 1.5 – 4×: sampling 8/Z ∈ [2, 5.3]
  { minZoom: 4, multiplier: 8 },     // 4 – 10×: sampling 16/Z ∈ [1.6, 4]
  { minZoom: 10, multiplier: 16 },   // 10×+ : sampling 32/Z, headroom for deep zoom
];

export class LabelResolutionLODBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private readonly opts: ResolvedOptions;
  private subs: Array<() => void> = [];
  /**
   * Index into `opts.levels` of the currently active tier. Re-evaluated
   * on every camera-zoom event; the renderer is only nudged when this
   * index actually changes, so a continuous zoom inside one tier costs
   * nothing past the cheap comparison below.
   */
  private currentTierIdx = 0;
  /** Last resolution actually pushed to the renderer. */
  private lastPushed: number | null = null;

  constructor(opts: LabelResolutionLODBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    const baseResolution =
      opts.baseResolution ??
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ??
      1;
    const rawLevels = opts.levels && opts.levels.length > 0 ? opts.levels : DEFAULT_LEVELS;
    // Sort + defensive-copy so callers can mutate their array after register.
    const levels = rawLevels.slice().sort((a, b) => a.minZoom - b.minZoom);
    // First tier must cover zoom 0; if the user didn't supply one, prepend.
    if (levels[0]!.minZoom > 0) {
      levels.unshift({ minZoom: 0, multiplier: 1 });
    }
    this.opts = {
      baseResolution,
      levels,
      hysteresis: opts.hysteresis ?? 0.1,
    };
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `LabelResolutionLODBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`,
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
    this.currentTierIdx = 0;
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
    this.currentTierIdx = 0;
  }

  /**
   * Re-evaluate the active tier under the current camera zoom and push the
   * tier's resolution to the renderer only when the tier index changes.
   * Continuous zoom inside one tier is a constant-time no-op past the
   * `idx === currentTierIdx` check below.
   */
  private apply(): void {
    if (!this.enabled) return;
    const renderer = this.layer?.getRenderer();
    if (!renderer || !this.ctx) return;
    const zoom = this.ctx.camera.scale;

    let idx = this.currentTierIdx;
    const levels = this.opts.levels;
    const hyst = this.opts.hysteresis;
    // Climb up: highest tier whose minZoom ≤ zoom wins.
    while (idx + 1 < levels.length && levels[idx + 1]!.minZoom <= zoom) idx++;
    // Climb down with hysteresis: only fall out of tier N when we're a
    // full `hysteresis` below its minZoom, never flicker on the boundary.
    while (idx > 0 && zoom < levels[idx]!.minZoom - hyst) idx--;

    if (idx === this.currentTierIdx && this.lastPushed !== null) return;
    this.currentTierIdx = idx;
    const next = levels[idx]!.multiplier * this.opts.baseResolution;
    if (this.lastPushed !== null && Math.abs(this.lastPushed - next) < 1e-6) return;
    this.lastPushed = next;
    renderer.setLabelsResolution(next);
  }
}
