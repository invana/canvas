/**
 * `ElementSizeLODBehaviour` — abstract base for zoom-driven "keep this
 * element at a fixed screen-pixel size" behaviours.
 *
 * Sits in the same family as `LabelResolutionLODBehaviour`: both react
 * to `camera:zoom`, both adapt how some kind of entity renders as the
 * camera scale changes. This base owns the shared plumbing — event
 * subscription, RAF coalescing of bursts, enable/disable lifecycle —
 * and leaves the *what to rescale* to concrete subclasses.
 *
 * ## Why a base + subclass split
 *
 * The "screen-constant size" need shows up across domains: graph nodes
 * and edges today; swimlane lane headers, annotation pins, ER table
 * decorations tomorrow. Putting the camera-zoom plumbing in canvas (which
 * already owns the camera and the behaviour base) and the per-element
 * rescaling in domain packages means:
 *
 * - Each domain ships its own subclass next to its data model. No need
 *   to modify an upstream "knows about everything" class to add a new
 *   element kind.
 * - The browser RAF callback batches every behaviour's scheduled
 *   callback into the same frame, so registering multiple subclasses
 *   has effectively the same per-frame cost as one monolith doing N
 *   passes.
 *
 * ## Concrete subclass contract
 *
 * Override `onResolveTargets(ctx)` once at register to resolve layer
 * references. Override `apply(scale)` to walk those targets and write
 * the rescaled geometry through the renderer's fast paths
 * (`updateShape`, `setConnectorStroke`, etc.).
 *
 * `disable()` calls `apply(1)` — your apply function should be
 * idempotent at scale 1 (which is what "restore to world-unit sizing"
 * means).
 *
 * ## MapLibre note
 *
 * `MapLayer` writes the pixi-viewport transform directly to mirror
 * MapLibre's camera. It re-emits `camera:zoom` on the canvas event bus
 * after each move so subclasses of this behaviour react under MapLibre
 * gestures the same as under `WheelZoomBehaviour`. Without that bridge
 * these behaviours would silently no-op under MapLibre.
 */

import type { CanvasContext } from '../context/CanvasContext';
import { Behaviour, type BehaviourOptions } from './Behaviour';

/** A static value or a getter — getters are re-read on every `apply`. */
export type NumberOrGetter = number | (() => number);

/** Coerce a {@link NumberOrGetter} to its current numeric value, or `undefined`. */
export function resolveNumberOrGetter(v: NumberOrGetter | undefined): number | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'function' ? v() : v;
}

export interface ElementSizeLODBehaviourOptions extends BehaviourOptions {
  /**
   * Skip `apply` when the relative scale change since the last applied
   * frame is below this threshold (`|scale - lastScale| / lastScale`).
   * Set to `0` to disable the skip. Default `0.005` (0.5%) — sub-pixel
   * stroke / size deltas at typical screen DPIs, which the user can't
   * perceive but a wheel-zoom gesture fires 60×/sec of.
   */
  scaleEpsilon?: number;
  /**
   * When `> 0`, switch from per-frame RAF apply to a trailing-edge
   * debounce: skip work during a continuous gesture and run one final
   * `apply` after `settleMs` of zoom silence. Useful for expensive
   * passes (e.g. thousands of connector redraws) where mid-gesture
   * visual drift is preferable to a frame-rate collapse. Default `0`
   * (RAF mode).
   */
  settleMs?: number;
}

export abstract class ElementSizeLODBehaviour extends Behaviour {
  private readonly subs: Array<() => void> = [];
  /**
   * Pending `requestAnimationFrame` handle. Non-null while a reflow is
   * scheduled but hasn't fired yet — collapses bursts of `camera:zoom`
   * events (the wheel-zoom gesture fires 100+/sec) into one `apply`
   * call per animation frame. Critical for keeping fps above 60 during
   * a continuous zoom over thousands of entities.
   */
  private rafHandle: number | null = null;
  /**
   * Settle timer (debounce) handle. Used instead of `rafHandle` when
   * `settleMs > 0`. Re-armed on every `camera:zoom`; firing triggers a
   * single `apply` at the latest scale.
   */
  private settleTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Scale at the last `apply` call. Drives the `scaleEpsilon` skip:
   * the next scheduled apply bails if the current scale is within
   * epsilon of this value. `null` means "no prior apply, never skip".
   */
  private lastAppliedScale: number | null = null;
  private readonly scaleEpsilon: number;
  private readonly settleMs: number;

  constructor(opts: ElementSizeLODBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.scaleEpsilon = opts.scaleEpsilon ?? 0.005;
    this.settleMs = opts.settleMs ?? 0;
  }

  protected override onRegister(ctx: CanvasContext): void {
    this.onResolveTargets(ctx);
    this.subs.push(ctx.events.on('camera:zoom', () => this.scheduleReflow()));
    // Pre-enabled register → apply once now so the first painted frame
    // already shows the rescaled sizes; we don't wait for the next zoom.
    if (this.isEnabled) this.applyAndRemember(ctx.camera.scale);
  }

  protected override onDestroy(): void {
    this.cancelScheduledReflow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.onReleaseTargets();
  }

  protected override onEnable(): void {
    if (!this.ctx) return;
    // Drop the prior epsilon baseline — the first scheduled apply after
    // (re-)enable must run regardless of how close the current scale is
    // to whatever was applied before the disable.
    this.lastAppliedScale = null;
    this.applyAndRemember(this.ctx.camera.scale);
  }

  protected override onDisable(): void {
    // Disable is reversible — cancel any pending reflow and "restore"
    // by applying at scale 1 (world-unit sizing). `apply` must be
    // idempotent there.
    this.cancelScheduledReflow();
    this.apply(1);
    // Don't remember `1` as the baseline — we'd then skip the post-enable
    // apply if the camera happened to be at scale ≈ 1.
    this.lastAppliedScale = null;
  }

  /**
   * Force an immediate reflow at the current camera scale. Useful after
   * tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
   * reads from) — push the new sizes without waiting for the next zoom.
   *
   * Bypasses the epsilon skip and the settle debounce — explicit calls
   * are always treated as "apply now."
   */
  reflow(): void {
    this.cancelScheduledReflow();
    if (!this.isEnabled || !this.ctx) return;
    this.applyAndRemember(this.ctx.camera.scale);
  }

  // ─── Subclass hooks ──────────────────────────────────────────────────────

  /**
   * Called once on register. Resolve layer references from `ctx.layers`
   * and stash them on `this` for later `apply` calls. Throw a descriptive
   * error if a required layer isn't present — the canvas guarantees
   * `ctx.layers` is fully populated before behaviours register.
   */
  protected abstract onResolveTargets(ctx: CanvasContext): void;

  /** Optional teardown hook — drop layer refs / caches. Default no-op. */
  protected onReleaseTargets(): void {
    /* default no-op */
  }

  /**
   * Apply rescaling at the given camera scale. Called by `onEnable`,
   * each `camera:zoom` (RAF coalesced), and by `onDisable` with
   * `scale = 1` to restore world-unit sizing.
   *
   * Implementations should be idempotent — calling twice with the same
   * scale is a no-op visually.
   */
  protected abstract apply(scale: number): void;

  // ─── Internals ───────────────────────────────────────────────────────────

  /**
   * Route a `camera:zoom` to either the RAF path (default) or the
   * trailing-edge debounce path (`settleMs > 0`). Both eventually call
   * {@link tryApply}, which honours the epsilon skip.
   */
  private scheduleReflow(): void {
    if (this.settleMs > 0) {
      // Debounce: every zoom event re-arms the timer. The timer firing
      // is the only thing that calls apply — during a continuous gesture
      // we do *no* work; we only catch up on settle.
      if (this.settleTimer !== null) clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        this.settleTimer = null;
        this.tryApply();
      }, this.settleMs);
      return;
    }
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.tryApply();
    });
  }

  /**
   * Apply at the current camera scale if (a) still enabled, (b) the
   * scale has moved by more than `scaleEpsilon` since the last apply.
   * Updates {@link lastAppliedScale} only on a real apply, so cumulative
   * sub-epsilon drift is eventually caught.
   */
  private tryApply(): void {
    if (!this.isEnabled || !this.ctx) return;
    const scale = this.ctx.camera.scale;
    const last = this.lastAppliedScale;
    if (
      last !== null &&
      last > 0 &&
      this.scaleEpsilon > 0 &&
      Math.abs(scale - last) / last < this.scaleEpsilon
    ) {
      return;
    }
    this.applyAndRemember(scale);
  }

  private applyAndRemember(scale: number): void {
    this.apply(scale);
    this.lastAppliedScale = scale;
  }

  private cancelScheduledReflow(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    if (this.settleTimer !== null) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
  }
}
