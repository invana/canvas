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

  constructor(opts: BehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  protected override onRegister(ctx: CanvasContext): void {
    this.onResolveTargets(ctx);
    this.subs.push(ctx.events.on('camera:zoom', () => this.scheduleReflow()));
    // Pre-enabled register → apply once now so the first painted frame
    // already shows the rescaled sizes; we don't wait for the next zoom.
    if (this.isEnabled) this.apply(ctx.camera.scale);
  }

  protected override onDestroy(): void {
    this.cancelScheduledReflow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.onReleaseTargets();
  }

  protected override onEnable(): void {
    if (!this.ctx) return;
    this.apply(this.ctx.camera.scale);
  }

  protected override onDisable(): void {
    // Disable is reversible — cancel any pending reflow and "restore"
    // by applying at scale 1 (world-unit sizing). `apply` must be
    // idempotent there.
    this.cancelScheduledReflow();
    this.apply(1);
  }

  /**
   * Force an immediate reflow at the current camera scale. Useful after
   * tuning a config knob (e.g. moving a GUI slider that a `NumberOrGetter`
   * reads from) — push the new sizes without waiting for the next zoom.
   */
  reflow(): void {
    this.cancelScheduledReflow();
    if (!this.isEnabled || !this.ctx) return;
    this.apply(this.ctx.camera.scale);
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

  private scheduleReflow(): void {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      if (!this.isEnabled || !this.ctx) return;
      this.apply(this.ctx.camera.scale);
    });
  }

  private cancelScheduledReflow(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }
}
