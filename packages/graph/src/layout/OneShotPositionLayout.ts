import {
  Layout,
  animatePositions,
  resolveEasing,
  DEFAULT_POSITION_TRANSITION_MS,
  type EasingName,
  type LayoutOptions,
  type PositionTransition,
} from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';

/**
 * The position set a {@link OneShotPositionLayout} subclass computes for a run.
 *
 * `positions` is a flat `Float32Array` of length `ids.length * 2` — `x, y`
 * interleaved per id, the shape `GraphStore.setPositionsBulk` consumes. Return
 * `null` (or an empty `ids`) to no-op the run (e.g. no nodes, no root).
 */
export interface LayoutPositions<M = unknown> {
  ids: string[];
  positions: Float32Array;
  /**
   * Optional per-run payload threaded back to {@link OneShotPositionLayout.onPositionsApplied}
   * after the positions settle — e.g. derived geometry that depends on the final
   * positions (ELK edge waypoints, circle-pack sizes, sunburst arcs). Threaded
   * through the run rather than stashed on the instance, so overlapping runs
   * can't clobber each other.
   */
  meta?: M;
}

/** Options shared by every one-shot (deterministic) layout. */
export interface OneShotLayoutOptions extends LayoutOptions {
  /**
   * Animate nodes from their current positions to the computed layout instead
   * of snapping. `true` uses {@link DEFAULT_POSITION_TRANSITION_MS}; a number is
   * an explicit duration in ms; `false` snaps. Default `true`.
   *
   * Serializable (boolean | number) so it rides the canvas config bag and binds
   * straight to a lil-gui control.
   */
  transition?: boolean | number;
  /**
   * Easing curve for the transition, as a serializable {@link EasingName} key.
   * Default `'easeOutCubic'`. Ignored when `transition` is `false`.
   */
  transitionEase?: EasingName;
  /**
   * Include explicitly-hidden nodes in the layout. Default `false` — hidden
   * nodes are excluded from placement so they don't perturb the visible graph,
   * and their last positions are left frozen (the layout never writes them).
   */
  includeHidden?: boolean;
}

/**
 * Base class for **one-shot** layouts — those that compute a final position for
 * every node in a single pass (ELK, d3-hierarchy trees/dendrograms, grid, snake,
 * circular, radial, …), as opposed to iterative simulations like
 * `D3ForceLayout` that paint their own per-tick evolution.
 *
 * It owns the parts every one-shot layout shares, so subclasses don't re-implement
 * them:
 *
 *  - the serializable `transition` / `transitionEase` options;
 *  - **snap-or-tween**: writing the computed positions straight to the store, or
 *    gliding each node from its current spot to the target via the engine's
 *    {@link animatePositions} helper;
 *  - **cancellation**: a run-token + in-flight-transition handle so a re-`apply()`
 *    (or `stop()`) aborts the previous run/transition cleanly and the next run
 *    starts from wherever the nodes currently are;
 *  - the uniform `start` / `tick` / `end` lifecycle (so `fitContent`-on-`end`
 *    fires at the same moment — after the transition settles — for all of them).
 *
 * Subclasses implement {@link computeLayout} (produce the target positions) and
 * may override {@link onPositionsApplied} (e.g. write computed edge geometry once
 * the nodes have landed).
 */
export abstract class OneShotPositionLayout<
  TOpts extends OneShotLayoutOptions = OneShotLayoutOptions,
> extends Layout<GraphLayer> {
  /**
   * The live options bag. Subclasses read their own fields off this (it's the
   * merged result of the constructor opts and every {@link setOptions} patch),
   * rather than keeping a private copy — so config edits take effect.
   */
  protected opts: TOpts;
  /** `false` | `true` (default ms) | explicit ms. See {@link OneShotLayoutOptions.transition}. */
  protected transition: boolean | number;
  /** Easing key for the transition. See {@link OneShotLayoutOptions.transitionEase}. */
  protected transitionEase: EasingName;

  /** Monotonic run id. Each `apply()` bumps it; stale runs check against it and bail. */
  private runToken = 0;
  /** True while a run (compute + transition) is in flight. */
  protected running = false;
  /** In-flight position transition, so `stop()` can cancel it. */
  private activeTransition: PositionTransition | null = null;
  /** Resolver for the `apply()` Promise blocked on the transition. */
  private transitionResolve: (() => void) | null = null;
  /** Last layer `apply()` ran against — so `setOptions` can re-run live. */
  private lastLayer: GraphLayer | null = null;

  constructor(opts: TOpts = {} as TOpts) {
    super(opts);
    this.opts = { ...opts };
    this.transition = opts.transition ?? true;
    this.transitionEase = opts.transitionEase ?? 'easeOutCubic';
  }

  /**
   * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })` (and
   * once at init with the `config.layouts[id]` slice). Merges the patch into
   * {@link opts}, re-derives the transition settings, and — if the layout has
   * already run against a layer — re-applies so the change shows immediately
   * (the one-shot analog of `D3ForceLayout` re-heating its simulation). Before
   * the first `apply()` it just records the options (no premature run).
   */
  override setOptions(patch: Partial<TOpts>): void {
    this.opts = { ...this.opts, ...patch };
    if (patch.transition !== undefined) this.transition = patch.transition;
    if (patch.transitionEase !== undefined) this.transitionEase = patch.transitionEase;
    if (this.lastLayer) void this.apply(this.lastLayer);
  }

  /**
   * Compute the target position for every node this layout places. Called once
   * per `apply()`. May be async (e.g. ELK). Return `null` / empty `ids` to no-op.
   *
   * Implementations only compute — the base writes the result (snap or tween),
   * manages cancellation, and fires the lifecycle.
   */
  protected abstract computeLayout(layer: GraphLayer): LayoutPositions | null | Promise<LayoutPositions | null>;

  /**
   * Whether a node should be placed by this run. Excludes explicitly-hidden
   * nodes unless {@link OneShotLayoutOptions.includeHidden} is set. Subclasses
   * call this while snapshotting `layer.store.nodes()` so hidden nodes stay
   * frozen at their last positions. Edges incident to a skipped node should be
   * dropped from the layout graph too (both endpoints must be placeable).
   */
  protected shouldPlaceNode(node: { hidden?: boolean }): boolean {
    return this.opts.includeHidden === true || node.hidden !== true;
  }

  /**
   * Hook run once the node positions have settled (immediately when snapping,
   * or after the transition completes), before `tick` / `end`. `meta` is the
   * payload {@link computeLayout} returned for this run. Override to write
   * derived geometry that depends on final positions — e.g. ELK edge routing,
   * pack sizes, sunburst arcs. Default no-op.
   */
  protected onPositionsApplied(_layer: GraphLayer, _meta: unknown): void {
    /* default no-op */
  }

  /**
   * Whether this run should animate (vs snap), on top of the `transition`
   * option. Defaults to `true`. Override to veto for runs whose output isn't a
   * pure position move — e.g. a mode that replaces node *geometry* (circle-pack
   * sizes, sunburst arcs) where tweening the positions would look wrong.
   */
  protected shouldTransition(_layer: GraphLayer): boolean {
    return true;
  }

  async apply(layer: GraphLayer): Promise<void> {
    // Cancel any in-flight run/transition first; the new run owns the future.
    this.stop();
    this.lastLayer = layer;
    const token = ++this.runToken;
    this.running = true;
    this.events.emit('start', {});

    let result: LayoutPositions | null;
    try {
      result = await Promise.resolve(this.computeLayout(layer));
    } catch (err) {
      if (token === this.runToken) {
        this.running = false;
        this.events.emit('end', { reason: 'completed' });
      }
      throw err;
    }

    // Superseded by a newer run while we were computing → drop this result.
    if (token !== this.runToken) return;

    if (!result || result.ids.length === 0) {
      this.running = false;
      this.events.emit('end', { reason: 'completed' });
      return;
    }

    await this.writePositions(layer, result.ids, result.positions, result.meta, token);
  }

  /** Cancel an in-flight run. Positions already written stay in the store. */
  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.runToken++;
    this.activeTransition?.cancel();
    this.activeTransition = null;
    const resolve = this.transitionResolve;
    this.transitionResolve = null;
    resolve?.();
    this.events.emit('end', { reason: 'stopped' });
  }

  /** Resolve the `transition` option to a concrete duration in ms (`0` = snap). */
  private transitionDurationMs(): number {
    if (this.transition === false) return 0;
    if (this.transition === true) return DEFAULT_POSITION_TRANSITION_MS;
    return Math.max(0, this.transition);
  }

  /** Snap or tween `target` onto the store, then run the settle hook + lifecycle. */
  private async writePositions(
    layer: GraphLayer,
    ids: string[],
    target: Float32Array,
    meta: unknown,
    token: number,
  ): Promise<void> {
    const store = layer.store;

    const applyGeometry = (): void => {
      if (token === this.runToken) this.onPositionsApplied(layer, meta);
    };
    const settle = (): void => {
      if (token !== this.runToken) return;
      this.events.emit('tick', {});
      this.running = false;
      this.events.emit('end', { reason: 'completed' });
    };

    const duration = this.shouldTransition(layer) ? this.transitionDurationMs() : 0;
    if (duration <= 0) {
      // Positions first, then derived geometry in its own flush. A derived edge
      // write (e.g. ELK orth waypoints) must NOT share the position flush or it
      // won't stick; node-local geometry (pack sizes, sunburst arcs) is flush-
      // order-agnostic. Sankey, whose `edge-port` anchors need the same flush as
      // the rects, stays off this base for that reason.
      store.setPositionsBulk(ids, target);
      applyGeometry();
      settle();
      return;
    }

    // Glide from current positions. New (un-positioned) nodes start at their
    // target so they don't fly in from the origin.
    const from = new Float32Array(ids.length * 2);
    for (let i = 0; i < ids.length; i++) {
      const p = store.getPosition(ids[i]!);
      from[i * 2] = p?.x ?? target[i * 2]!;
      from[i * 2 + 1] = p?.y ?? target[i * 2 + 1]!;
    }

    await new Promise<void>((resolve) => {
      this.transitionResolve = resolve;
      this.activeTransition = animatePositions({
        from,
        to: target,
        duration,
        easing: resolveEasing(this.transitionEase),
        onFrame: (xy) => store.setPositionsBulk(ids, xy),
        onComplete: () => {
          this.activeTransition = null;
          this.transitionResolve = null;
          applyGeometry();
          settle();
          resolve();
        },
      });
    });
  }
}
