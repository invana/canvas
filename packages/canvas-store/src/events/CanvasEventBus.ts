import type { LayerFlush } from '../data/LayerData';
import { CANVAS_SOURCE, type CanvasEvent, type EventSource } from './CanvasEvent';
import { EventEmitter, type Listener } from './EventEmitter';

/**
 * The canvas-wide event map. Consumers (engine, domain) **augment** this via
 * declaration merging — `declare module '@invana/canvas-store' { interface
 * CanvasGlobalEvents { 'shape:click': … } }` — so new events are typed without
 * touching the core.
 */
export interface CanvasGlobalEvents {
  // ── coarse aggregate channels (kernel-emitted) ──────────────────────────────
  /** A `view`-store mutation, bridged onto the bus (see `createCanvasStore`). */
  'state:change': { action?: string; changedPaths: string[] };
  /** A `layer` data flush (nodes/edges/groups/annotations delta), bridged onto the bus. */
  'data:flush': { layerId: string; delta: LayerFlush };
  /** A named data **intent** — one per data action (audit / collab), distinct from the per-frame flush. */
  'data:intent': { action: string; layerId: string; ids: readonly string[] };

  // ── scene — registry composition (engine-emitted) ───────────────────────────
  'scene:layer:add': { id: string };
  'scene:layer:remove': { id: string };
  'scene:behaviour:register': { id: string };
  'scene:behaviour:enable': { id: string };
  'scene:behaviour:disable': { id: string };
  'scene:layout:add': { id: string };
  'scene:layout:remove': { id: string };

  // ── input — raw user input on elements (engine-emitted; behaviours consume) ──
  'input:node:click': { layerId: string; id: string; x: number; y: number };
  'input:node:hover': { layerId: string; id: string | null };
  'input:node:drag:start': { layerId: string; id: string };
  'input:node:drag:end': { layerId: string; id: string };
  'input:background:contextmenu': { x: number; y: number };

  // ── layout — execution lifecycle (engine-emitted) ───────────────────────────
  'layout:run:start': { id: string; layerId: string };
  'layout:run:end': { id: string; layerId: string };
  'layout:run:tick': { id: string; progress?: number };

  // ── render / canvas — lifecycle (engine-emitted) ────────────────────────────
  'canvas:renderer:ready': { backend: string };
  'render:loop:tick': { dt: number };
  'canvas:message:show': { text: string };
}

/**
 * The granular **`<domain>:<subject>:<action>`** types (`view:layer:setStyle`,
 * `data:node:add`, …) are open-ended — emitted via {@link CanvasEventBus.publish}
 * (they ride on the tap, keyed by the action label) rather than enumerated here.
 * The map above types the **finite, engine-emitted** events for `on()`/`emit()`.
 */

/** Per-tap filters. */
export interface TapOptions {
  /** Event `type`s to drop from this tap. */
  exclude?: readonly string[];
  /** Fraction (0..1) of events to forward — cheap sampling for costly sinks. */
  sampleRate?: number;
}

/** A tap receives every emission as a structured {@link CanvasEvent}. */
export type Tap = (event: CanvasEvent) => void;

/**
 * Canvas-wide event bus: typed `on`/`emit` for known events, **plus a tap
 * channel** that receives every emission (typed *and* forwarded scoped events) as
 * a structured {@link CanvasEvent}. The tap is the single place telemetry /
 * collaboration observe the whole stream — `bus.tap(e => sink(e))`.
 *
 * Renderer-free: the engine wires pixi pointer events *into* this; the bus knows
 * nothing about pixi.
 */
export class CanvasEventBus {
  private readonly emitter = new EventEmitter<CanvasGlobalEvents>();
  private readonly taps = new Set<{ fn: Tap; opts: TapOptions }>();
  private readonly now: () => number;
  private readonly rand: () => number;

  constructor(opts?: { now?: () => number; random?: () => number }) {
    this.now = opts?.now ?? (() => Date.now());
    this.rand = opts?.random ?? (() => Math.random());
  }

  /** Subscribe to a typed global event. */
  on<K extends keyof CanvasGlobalEvents>(
    type: K,
    listener: Listener<CanvasGlobalEvents[K]>,
  ): () => void {
    return this.emitter.on(type, listener);
  }

  /** Emit a typed global event — reaches typed listeners and the tap channel. */
  emit<K extends keyof CanvasGlobalEvents>(
    type: K,
    payload: CanvasGlobalEvents[K],
    source: EventSource = CANVAS_SOURCE,
  ): void {
    this.emitter.emit(type, payload);
    this.toTaps(type as string, payload, source);
  }

  /**
   * Forward a **scoped / foreign** event (not in {@link CanvasGlobalEvents}) to the
   * tap channel only — used by {@link SourceEmitter} so a store/layer/behaviour's
   * own events reach the canvas tap without being global-bus types.
   */
  publish(type: string, payload: unknown, source: EventSource): void {
    this.toTaps(type, payload, source);
  }

  private toTaps(type: string, payload: unknown, source: EventSource): void {
    if (this.taps.size === 0) return;
    const event: CanvasEvent = { type, timestamp: this.now(), source, payload };
    for (const { fn, opts } of [...this.taps]) {
      if (opts.exclude?.includes(type)) continue;
      if (opts.sampleRate !== undefined && this.rand() > opts.sampleRate) continue;
      fn(event);
    }
  }

  /** Subscribe to the whole event stream (structured envelopes). */
  tap(fn: Tap, opts: TapOptions = {}): () => void {
    const entry = { fn, opts };
    this.taps.add(entry);
    return () => this.taps.delete(entry);
  }

  clearTaps(): void {
    this.taps.clear();
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
    this.taps.clear();
  }
}
