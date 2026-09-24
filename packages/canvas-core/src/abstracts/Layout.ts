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

import { EventEmitter } from '../state/events/EventEmitter';
import type { Layer } from './Layer';

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
  /**
   * Run is about to produce positions. Optional run-size / animation metadata
   * lets a `Canvas.runLayout` bridge forward it onto the canvas bus as
   * `layout:run:start` without reaching into layer internals. Every field is
   * optional — a layout that doesn't know (or care) emits `{}`, and the bridge
   * substitutes `0` / `false`.
   *
   *  - `nodeCount` / `edgeCount` — size of the run, for progress UIs / telemetry.
   *  - `animate` — whether the run animates its settle (iterative force sims)
   *    vs. jumps straight to final positions; render policies branch on it.
   */
  start: { nodeCount?: number; edgeCount?: number; animate?: boolean };
  tick: Record<string, never>;
  end: { reason: LayoutEndReason };
};

/**
 * How one layout run should behave — passed per call to {@link Layout.apply}
 * (and `Canvas.runLayout`), as opposed to {@link LayoutOptions}, which are the
 * layout's standing configuration.
 *
 * Both fields describe a **re-flow** the user did not ask for directly — e.g.
 * `CollapseExpandBehaviour` re-running the active layout after a group frame
 * opens or closes — where the point is to keep the picture steady.
 */
export interface LayoutRunOptions {
  /**
   * Keep this node where it is on screen. The run computes positions as usual,
   * then shifts the whole result so this node's box centre stays where it was;
   * everything else re-flows around it. Honoured by layouts that support it
   * (the one-shot layouts and `D3ForceLayout`); ignored by the rest.
   */
  anchorNodeId?: string;
  /**
   * Leave the camera alone for this run. Fitters that normally re-frame the
   * view when a layout ends (the `fitOnLoad` auto-fitter, the React layout
   * wrappers' `fitPadding`) skip a run carrying this flag.
   */
  preserveCamera?: boolean;
}

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
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
   * `'elk-layout'`). Distinct from {@link id} (the per-instance key): all
   * `D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  readonly kind?: string;

  /**
   * Lifecycle event bus. See class docs for the event vocabulary.
   * Subclasses with richer telemetry can declare their own typed
   * emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).
   */
  readonly events: EventEmitter<LayoutEvents> = new EventEmitter<LayoutEvents>();

  /**
   * Options of the run in flight, or of the last one once it has ended.
   * Implementations record them at the top of {@link apply}, so an `end`
   * listener can tell what kind of run just finished — e.g. a fitter skipping
   * a {@link LayoutRunOptions.preserveCamera} run.
   */
  runOptions: Readonly<LayoutRunOptions> = {};

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
   * Contribute this layout's serialisable config to a canvas-state snapshot (the
   * engine's `DefinitionSerializable` contract). The base captures the wiring
   * `targetLayerId`; iterative layouts holding tunable params (e.g. force
   * strengths) should override and spread `super.serializeDefinition()` with a
   * JSON-safe copy of those params.
   */
  serializeDefinition(): Record<string, unknown> | undefined {
    return this.targetLayerId !== undefined ? { targetLayerId: this.targetLayerId } : undefined;
  }

  /**
   * Run the layout against `layer`. Resolves when the run terminates
   * (either a natural settle or an external `stop()`).
   *
   * Calling `apply()` again on the same instance must cancel any in-flight
   * run first, and must record `run` on {@link runOptions} before emitting
   * `start`.
   *
   * @param run How this particular run should behave; see {@link LayoutRunOptions}.
   */
  abstract apply(layer: TLayer, run?: LayoutRunOptions): Promise<void>;
}
