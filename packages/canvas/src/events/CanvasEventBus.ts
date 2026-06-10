/**
 * `CanvasEventBus` — canvas-wide event hub with two channels:
 *
 *   1. **Typed canvas-wide events** (`on / emit`) — for things that genuinely
 *      live at the canvas level: `layer:added`, `behaviour:enabled`,
 *      `camera:zoom`, `renderer:initialised`, `background:click`, …
 *
 *   2. **Tap channel** (`tap`) — a single firehose subscription that receives
 *      a `CanvasEvent` envelope for every event emitted system-wide
 *      (canvas + every layer + every behaviour). Telemetry sinks register here
 *      and see everything.
 *
 * Architecture: see `architecture-proposal.md` §2.5.
 *
 * **Why a tap channel and not bubbling?**
 *
 * | Aspect | Tap | Bubbling |
 * |---|---|---|
 * | App subscriptions | Clean — only what you ask for | Noisy — every layer's events at canvas |
 * | Telemetry hookup | One line, sees everything | Must enumerate every emitter |
 * | Sampling/filtering | At the tap, one place | Per-subscriber boilerplate |
 * | Payload shape | Plain payload + envelope | One shape for both audiences |
 *
 * **Forwarding pattern**
 *
 * Per-source emitters (`SourceEmitter`) hold an optional reference to the bus.
 * When they `emit(name, payload)`, they additionally call `bus.publish(envelope)`
 * which fan-outs to every tap subscriber (after exclude/sampleRate filtering).
 * Local subscribers see the plain payload; tap subscribers see the envelope.
 *
 * @example
 * const bus = new CanvasEventBus();
 *
 * // Telemetry sink — sees everything except the default high-frequency exclude list.
 * bus.tap((event) => sendToDatadog(event));
 *
 * // Dev-mode timeline — sees everything including pointermove.
 * bus.tap((event) => devLog.push(event), { exclude: [] });
 *
 * // Sampled sink — 10% of events.
 * bus.tap((event) => costlyAnalytics(event), { sampleRate: 0.1 });
 */

import { EventEmitter } from './EventEmitter';
import type { EventMap } from './EventEmitter';
import type { CanvasEvent, EventSource } from './CanvasEvent';
import { isExcludedFromTap, DEFAULT_TAP_EXCLUDE, makeCanvasEvent } from './CanvasEvent';
import { assertSerialisableInDev } from './assertSerialisable';

/**
 * Default canvas-wide event map. Domain packages or the canvas implementation
 * can extend it via TypeScript module augmentation; for now we keep it open.
 *
 * Listed here are events that the canvas itself or its built-in primitives
 * emit. Additional event names get added as their producers land.
 */
export interface CanvasGlobalEvents extends EventMap {
  'renderer:initialised': {
    backend: 'webgpu' | 'webgl' | 'canvas';
    capabilities?: Record<string, unknown>;
  };
  'layer:added': { id: string };
  'layer:removed': { id: string };
  'layout:added': { id: string };
  'layout:removed': { id: string };
  'behaviour:registered': { id: string };
  'behaviour:enabled': { id: string };
  'behaviour:disabled': { id: string };
  'camera:zoom': { scale: number; centerX: number; centerY: number };
  'camera:pan': { x: number; y: number };
  'background:click': { worldX: number; worldY: number };
  'tap:dropped': { type: string; reason: 'excluded' | 'sampled' };
  /** `Canvas.update()` patched the options; carries the touched ids (serialisable). */
  'options:change': { changedLayerIds: readonly string[]; changedBehaviourIds: readonly string[] };
  /**
   * The shared message channel — anything (a layout's start/end, a behaviour
   * activating, app code) emits a line for a status surface to display.
   * `text: null` clears the current message; `timeout` (ms) auto-clears it.
   * Emit via `Canvas.showMessage` / `ctx.showMessage` rather than by hand.
   */
  'message': { text: string | null; timeout?: number };
}

export type TapHandler = (event: CanvasEvent) => void;

export interface TapOptions {
  /**
   * Suffix-matched event-type strings to exclude. Defaults to
   * `DEFAULT_TAP_EXCLUDE` (high-frequency noise like `pointermove`,
   * `render:tick`). Pass `[]` to see everything.
   */
  exclude?: readonly string[];
  /**
   * 0..1. Probability that any given (non-excluded) event is delivered to
   * this tap. Default `1` (no sampling). Use for high-volume sinks.
   */
  sampleRate?: number;
}

interface TapSubscription {
  handler: TapHandler;
  exclude: readonly string[];
  sampleRate: number;
}

export interface CanvasEventBusOptions {
  /** Source identity for envelopes the bus publishes via its own `emit()`.
   * Default: `{ kind: 'canvas', id: 'canvas' }`. Override per Canvas instance. */
  source?: EventSource;
}

export class CanvasEventBus extends EventEmitter<CanvasGlobalEvents> {
  private readonly taps: Set<TapSubscription> = new Set();
  private readonly source: EventSource;

  constructor(opts: CanvasEventBusOptions = {}) {
    super();
    this.source = opts.source ?? { kind: 'canvas', id: 'canvas' };
  }

  /**
   * Override of `EventEmitter.emit` so canvas-wide events ALSO reach the tap
   * channel (per `architecture-proposal.md` §2.5: "every emitter — canvas,
   * layer, behaviour — auto-forwards an envelope to the tap").
   *
   * Order: dev-mode serialisability check → local subscribers → tap publish.
   * A throwing local handler is isolated by `EventEmitter.emit`; a throwing
   * tap handler is isolated by `publish()`.
   */
  emit<K extends keyof CanvasGlobalEvents>(
    event: K,
    payload: CanvasGlobalEvents[K],
  ): void {
    assertSerialisableInDev(payload, `canvas.events.emit('${String(event)}')`);
    super.emit(event, payload);
    this.publish(makeCanvasEvent(this.source, String(event), payload));
  }

  /**
   * Subscribe to the tap channel. Returns an unsubscribe function.
   *
   * Default exclude: `DEFAULT_TAP_EXCLUDE` (high-frequency noise).
   * Default sampleRate: `1` (no sampling).
   *
   * Errors thrown by tap handlers are caught and logged via `console.error`,
   * just like local emitter handlers — one bad sink can't break the rest.
   */
  tap(handler: TapHandler, opts: TapOptions = {}): () => void {
    const sub: TapSubscription = {
      handler,
      exclude: opts.exclude ?? DEFAULT_TAP_EXCLUDE,
      sampleRate: opts.sampleRate ?? 1,
    };
    this.taps.add(sub);
    return () => {
      this.taps.delete(sub);
    };
  }

  /**
   * Publish an envelope to all tap subscribers. Called by `SourceEmitter`
   * (and by canvas-internal code that emits envelopes directly).
   *
   * Filtering applies per-tap:
   *   - exclude list (suffix-match against event type)
   *   - sampleRate
   *
   * No allocation per call other than what the handlers themselves do.
   */
  publish(event: CanvasEvent): void {
    if (this.taps.size === 0) return;

    for (const sub of this.taps) {
      if (isExcludedFromTap(event.type, sub.exclude)) continue;
      if (sub.sampleRate < 1 && Math.random() >= sub.sampleRate) continue;
      try {
        sub.handler(event);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[CanvasEventBus] tap handler threw on event "${event.type}":`, err);
      }
    }
  }

  /** Number of currently registered tap subscribers. Useful in tests. */
  tapCount(): number {
    return this.taps.size;
  }

  /** Drop all tap subscribers. Used on canvas teardown. */
  clearTaps(): void {
    this.taps.clear();
  }
}
