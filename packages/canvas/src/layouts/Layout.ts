/**
 * `Layout` — function from data to positions.
 *
 * Architecture: see `architecture-proposal.md` §2.3.
 *
 * Per the proposal:
 *  - A Layout does NOT register with the canvas.
 *  - It does NOT render.
 *  - It does NOT subscribe to input.
 *  - You instantiate it and call it against a layer.
 *
 *      const layout = new D3ForceLayout({ charge: -300 });
 *      layout.events.on('end', () => canvas.camera.fitContent(...));
 *      await layout.apply(graphLayer);
 *
 * Continuous-running cases (e.g. always-relax force simulation) are handled
 * by a thin wrapper Behaviour that calls `apply()` on a tick — keeps the
 * Layout API clean while supporting the rare continuous case.
 *
 * Whether two layouts conflict is a domain concern (don't apply two layouts
 * to the same data) — not enforced here.
 *
 * ## Lifecycle events
 *
 * Every layout owns a typed `events` emitter and fires three lifecycle
 * events around `apply()`:
 *
 *  - `start` — emitted once, synchronously, after the layout has set up
 *    its internal state and just before it begins producing positions.
 *  - `tick` — emitted whenever the layout writes a fresh batch of positions.
 *    One-shot layouts (e.g. ELK) fire it once. Iterative layouts (force
 *    sims) fire it on every iteration. High-frequency; subscribe sparingly.
 *  - `end` — emitted once when the run terminates. `reason` distinguishes
 *    a natural settle from an external `stop()` call.
 *
 * Subscribe to these events to drive camera fits, progress UI, etc. —
 * instead of listening to per-tick `data:changed` on the layer, which
 * conflates "structure changed" with "positions updated".
 */

import { EventEmitter } from '../events/EventEmitter';
import type { Layer } from '../layers/Layer';

/**
 * Why the run ended.
 *
 *  - `completed` — the layout settled / finished on its own.
 *  - `stopped`   — `stop()` (or a second `apply()`) cancelled it.
 */
export type LayoutEndReason = 'completed' | 'stopped';

/**
 * Lifecycle events fired by every `Layout`.
 *
 * Subclass-specific telemetry (e.g. d3-force's `alpha`) belongs on a
 * subclass-specific event map, not here.
 */
export type LayoutEvents = {
  start: Record<string, never>;
  tick: Record<string, never>;
  end: { reason: LayoutEndReason };
};

/** Construction options every layout shares (for the `LayoutRegistry`). */
export interface LayoutOptions {
  /** Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`. */
  id?: string;
  /** The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly. */
  targetLayerId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Layout<TLayer extends Layer<any, any, any, any> = Layer<any, any, any, any>> {
  /** Stable id (registry / config key). */
  readonly id: string;
  /** The layer this layout targets, if declared at construction. */
  readonly targetLayerId?: string;

  /**
   * Lifecycle event bus. See class docs for the event vocabulary.
   * Subclasses with richer telemetry can declare their own typed
   * emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).
   */
  readonly events: EventEmitter<LayoutEvents> = new EventEmitter<LayoutEvents>();

  constructor(opts: LayoutOptions = {}) {
    this.id = opts.id ?? 'layout';
    this.targetLayerId = opts.targetLayerId;
  }

  /**
   * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
   * Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
   * the patch and re-heat a running simulation.
   */
  setOptions(_patch: unknown): void {
    /* default no-op */
  }

  /**
   * Run the layout against `layer`. Resolves when the run terminates
   * (either a natural settle or an external `stop()`).
   *
   * Calling `apply()` again on the same instance must cancel any in-flight
   * run first.
   */
  abstract apply(layer: TLayer): Promise<void>;
}
