/**
 * `ScreenSizeBehaviour` — keeps a layer's entity sizes constant in *screen
 * pixels* across camera zoom by routing the live camera scale into one or
 * more {@link ScreenScaleTarget} subclasses.
 *
 * **Why a behaviour, not a layer option.** `WorldLayer` content is camera-
 * affected by design — pan / zoom moves it with the viewport. That's the
 * right default for diagrams and force layouts where the relative
 * geometry between entities matters. But for map overlays and many
 * dashboard-style views you want pixel-constant markers: small dot at
 * every zoom level, click-target stable, dense overlays still readable
 * at city zoom. Opt-in via this behaviour, off by default.
 *
 * **The canvas package stays domain-free.** This behaviour doesn't know
 * about nodes, edges, fields, or stores. Each `ScreenScaleTarget`
 * subclass (shipped by domain packages — see `@invana/graph`'s
 * `GraphNodesScreenScaleTarget` / `GraphEdgesScreenScaleTarget`)
 * translates `reflow(scale)` into the right per-attribute mutation on
 * the domain's data model. Compose multiple instances to scale multiple
 * attribute kinds atomically per frame.
 *
 * **Perf — RAF coalesced.** The wheel-zoom gesture fires `camera:zoom`
 * faster than the renderer can keep up (60–120 Hz). The behaviour
 * coalesces every burst of zoom events into a single `requestAnimationFrame`
 * callback so each target's `reflow` runs at most once per frame, no
 * matter how many events arrive. Stories with thousands of entities
 * stay above 60 fps during a continuous zoom.
 *
 * **MapLibre note.** `MapLayer` writes the pixi-viewport transform
 * directly (it has to, to mirror MapLibre's exact camera). `Camera`'s
 * `camera:zoom` event only fires because `MapLayer.syncCameraFromMap`
 * explicitly re-emits it after each move. Without that bridge, this
 * behaviour would silently never trigger under MapLibre's zoom gesture.
 *
 * @example
 * ```ts
 * import { ScreenSizeBehaviour } from '@invana/canvas';
 * import {
 *   GraphNodesScreenScaleTarget,
 *   GraphEdgesScreenScaleTarget,
 * } from '@invana/graph';
 *
 * canvas.behaviours.register(
 *   new ScreenSizeBehaviour({
 *     id: 'screen-size',
 *     enabled: true,
 *     targets: [
 *       new GraphNodesScreenScaleTarget({ layerId: 'graph', sizePx: 6, strokeWidthPx: 1 }),
 *       new GraphEdgesScreenScaleTarget({ layerId: 'graph', strokeWidthPx: 0.6 }),
 *     ],
 *   }),
 * );
 * ```
 */

import type { CanvasContext } from '../context/CanvasContext';
import { Behaviour, type BehaviourOptions } from './Behaviour';

/**
 * Base class for screen-scale targets. Subclass for each kind of entity
 * the behaviour should rescale — nodes, edges, group headers, annotation
 * pins, anything.
 *
 * **Why a class, not an interface.** Targets typically need to resolve
 * a layer reference at `register` time, hold per-instance state (caches,
 * subscriptions), and clean up on destroy. A class gives that lifecycle
 * cleanly while leaving `reflow` / `restore` abstract so each subclass
 * decides what fields to write.
 *
 * Lifecycle from the behaviour:
 *
 *   register(ctx) → on first behaviour register; resolve layer refs here.
 *   enable        → reflow(currentScale)         // start scaling
 *   zoom event    → reflow(newScale)             // continue scaling (RAF coalesced)
 *   disable       → restore()                    // revert to world-unit sizing
 *   destroy(ctx)  → drop subscriptions, release refs
 *
 * `reflow` may be called repeatedly with the same scale; implementations
 * should be idempotent.
 */
export abstract class ScreenScaleTarget {
  protected ctx?: CanvasContext;

  /**
   * Called once when the owning behaviour is registered. Idempotent —
   * calling twice is a no-op. Subclasses override `onRegister` to resolve
   * layer references and subscribe to store events.
   */
  register(ctx: CanvasContext): void {
    if (this.ctx) return;
    this.ctx = ctx;
    this.onRegister(ctx);
  }

  /** Called when the owning behaviour is destroyed. Drop subscriptions. */
  destroy(): void {
    if (!this.ctx) return;
    this.onDestroy();
    this.ctx = undefined;
  }

  /** Re-apply screen-constant sizing using the supplied camera scale. */
  abstract reflow(cameraScale: number): void;

  /** Revert to world-unit sizing — undo every write `reflow` made. */
  abstract restore(): void;

  /** Override to resolve layer refs / subscribe to events. Default no-op. */
  protected onRegister(_ctx: CanvasContext): void {
    /* default no-op */
  }

  /** Override to drop subscriptions / release caches. Default no-op. */
  protected onDestroy(): void {
    /* default no-op */
  }
}

export interface ScreenSizeBehaviourOptions extends BehaviourOptions {
  /**
   * Targets driven on each `camera:zoom`. Built by domain packages by
   * subclassing {@link ScreenScaleTarget}. Compose multiple instances to
   * scale multiple attribute kinds (node body, node outline, edge stroke,
   * group header height, …) atomically per frame.
   */
  targets: ScreenScaleTarget[];
}

export class ScreenSizeBehaviour extends Behaviour {
  private readonly targets: ScreenScaleTarget[];
  private readonly subs: Array<() => void> = [];
  /**
   * Pending `requestAnimationFrame` handle. Non-null while a reflow is
   * scheduled but hasn't fired yet — collapses bursts of `camera:zoom`
   * events into one reflow per animation frame. Critical for keeping
   * fps above 60 during a continuous wheel-zoom over thousands of
   * entities (the gesture can fire 100+ events per second).
   */
  private rafHandle: number | null = null;

  constructor(opts: ScreenSizeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.targets = opts.targets.slice();
  }

  protected override onRegister(ctx: CanvasContext): void {
    for (const t of this.targets) t.register(ctx);

    // RAF-coalesced reflow. Every camera:zoom asks for a reflow on the
    // next animation frame; if one is already scheduled, no-op. The
    // resulting reflow reads `ctx.camera.scale` fresh, so it picks up
    // the *latest* scale even if 30 events fired since we scheduled.
    this.subs.push(ctx.events.on('camera:zoom', () => this.scheduleReflow()));

    // If registered pre-enabled, sync immediately. Skip RAF — the caller
    // expects the first frame to already show pixel-constant sizes.
    if (this.isEnabled) this.runReflow();
  }

  protected override onDestroy(): void {
    this.cancelScheduledReflow();
    for (const off of this.subs) off();
    this.subs.length = 0;
    for (const t of this.targets) t.destroy();
  }

  protected override onEnable(): void {
    this.runReflow();
  }

  protected override onDisable(): void {
    // Disable is reversible — cancel any pending reflow and revert the
    // targets to their world-unit sizing. Don't `destroy` here.
    this.cancelScheduledReflow();
    for (const t of this.targets) t.restore();
  }

  /**
   * Force an immediate reflow at the current camera scale. Useful after
   * a target's parameters change at runtime (GUI knobs) — push the new
   * sizes without waiting for the next zoom event.
   */
  reflow(): void {
    this.cancelScheduledReflow();
    this.runReflow();
  }

  /**
   * Add a target after register. Useful when a target's layer dependency
   * comes online later (e.g. a layer added post-canvas-init). Reflowed
   * immediately if the behaviour is enabled.
   */
  addTarget(target: ScreenScaleTarget): void {
    this.targets.push(target);
    if (this.ctx) target.register(this.ctx);
    if (this.isEnabled && this.ctx) target.reflow(this.ctx.camera.scale);
  }

  private scheduleReflow(): void {
    if (this.rafHandle !== null) return;
    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.runReflow();
    });
  }

  private cancelScheduledReflow(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private runReflow(): void {
    if (!this.isEnabled || !this.ctx) return;
    const scale = this.ctx.camera.scale;
    for (const t of this.targets) t.reflow(scale);
  }
}
