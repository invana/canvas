import { CANVAS_SOURCE, type CanvasEvent, type EventSource } from './CanvasEvent';
import { EventEmitter, type Listener } from './EventEmitter';

/**
 * The canvas-wide event map. Consumers (engine, domain) **augment** this via
 * declaration merging — `declare module '@invana/canvas-core' { interface
 * CanvasGlobalEvents { 'shape:click': … } }` — so new events are typed without
 * touching the core.
 */
export interface CanvasGlobalEvents {
  /** A state-store mutation, bridged onto the bus (see `createCanvasCore`). */
  'state:change': { action?: string; changedPaths: string[] };
}

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
