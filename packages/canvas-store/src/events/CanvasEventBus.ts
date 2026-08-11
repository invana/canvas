import type { SpecFlush } from '../specs/SpecStore';
import type { LayerFlush } from '../data/LayerData';
import type { FrameTick } from '../perf/frame';
import type { ResolvedTheme } from '../theme/types';
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
  /**
   * A `view`-store mutation, bridged onto the bus (see `createCanvasStore`).
   * `durationMs` is the update's produce+commit wall-clock cost, when the store
   * reports it — so a tap can attribute time without a separate telemetry sink.
   */
  'state:change': { action?: string; changedPaths: string[]; durationMs?: number };
  /** A `layer` data flush (nodes/edges/groups/annotations delta), bridged onto the bus. */
  'data:flush': { layerId: string; delta: LayerFlush };
  /**
   * One layer's coalesced **spec** changes — the visual description, ids only.
   * Domain-free by construction: a renderer subscribes to this and never learns
   * what a node or an edge is. See `docs/renderer-split-design.md` §4.2b.
   */
  'specs:flush': { layerId: string; delta: SpecFlush };
  /** A named data **intent** — one per data action (audit / collab), distinct from the per-frame flush. */
  'data:intent': { action: string; layerId: string; ids: readonly string[] };

  // ── scene — registry composition (engine-emitted) ───────────────────────────
  'scene:layer:add': { id: string };
  'scene:layer:remove': { id: string };
  /**
   * A layer's whole-layer `visible` flag changed via `Layer.setVisible`. Lets
   * dependent layers (e.g. a `MiniMapLayer` mirroring a source graph) react
   * without polling. `visible` is the post-change value.
   */
  'scene:layer:visibilitychange': { id: string; visible: boolean };
  'scene:behaviour:register': { id: string };
  'scene:behaviour:enable': { id: string };
  'scene:behaviour:disable': { id: string };
  'scene:layout:add': { id: string };
  'scene:layout:remove': { id: string };

  // ── input — raw user input (engine/renderer-emitted; behaviours consume) ─────
  'input:node:click': { layerId: string; id: string; x: number; y: number };
  'input:node:hover': { layerId: string; id: string | null };
  'input:node:drag:start': { layerId: string; id: string };
  'input:node:drag:end': { layerId: string; id: string };
  'input:background:click': { x: number; y: number };
  'input:background:contextmenu': { x: number; y: number };
  /**
   * A pan **gesture** reported by the renderer (drag / keyboard / inertia) —
   * gesture *intent*, distinct from the resulting `view.interaction.camera` change
   * (a `state:change`). `x`/`y` are the world-origin offset the camera settled on.
   */
  'input:camera:pan': { x: number; y: number };
  /** A zoom **gesture** reported by the renderer (wheel / pinch). `scale` is the resolved uniform zoom; `center*` the screen pivot. */
  'input:camera:zoom': { scale: number; centerX: number; centerY: number };

  // ── layout — execution lifecycle (engine-emitted) ───────────────────────────
  /** A layout run started. `nodeCount`/`edgeCount`/`animate` describe the run when the producer knows them. */
  'layout:run:start': {
    id: string;
    layerId: string;
    nodeCount?: number;
    edgeCount?: number;
    animate?: boolean;
  };
  /** A layout run ended. `reason` distinguishes a natural settle from an external stop / abort. */
  'layout:run:end': {
    id: string;
    layerId: string;
    reason?: 'settled' | 'stopped' | 'cancelled';
  };
  'layout:run:tick': { id: string; progress?: number };

  // ── render / canvas — lifecycle (engine/renderer-emitted) ───────────────────
  'canvas:renderer:ready': { backend: string; capabilities?: Record<string, unknown> };
  /**
   * The active renderer crashed at **render time** and the engine has halted its
   * render loop. Emitted once (experimental WebGPU only — see
   * `CanvasOptions.preference`); the consumer should tear the canvas down and
   * re-init on `to` (WebGL). `reason` is a short diagnostic tag.
   */
  'canvas:renderer:fallback': { from: string; to: string; reason?: string };
  /**
   * One measured engine frame — emitted once per `Canvas.tickOnce`. Carries the
   * inter-frame period, per-phase CPU breakdown, and the attributed
   * {@link InteractionKind}, so a tap can drive an FPS trace + attribute dips to
   * the gesture that caused them. See {@link FrameTick}.
   */
  'render:loop:tick': FrameTick;
  /** The shared status-message channel. `text: null` clears; `timeout` (ms) auto-clears. */
  'canvas:message:show': { text: string | null; timeout?: number };
  /** A tap dropped an event (filtered or sampled out) — diagnostic. */
  'tap:dropped': { type: string; reason: 'excluded' | 'sampled' };

  // ── theme — resolved-theme broadcast (CanvasThemeState.set) ──────────────────
  'theme:change': ResolvedTheme;
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

  /** Subscribe to a typed global event. Returns an unsubscribe fn (or use {@link off}). */
  on<K extends keyof CanvasGlobalEvents>(
    type: K,
    listener: Listener<CanvasGlobalEvents[K]>,
  ): () => void {
    return this.emitter.on(type, listener);
  }

  /** Remove a previously-registered typed listener (the {@link on} handler by reference). */
  off<K extends keyof CanvasGlobalEvents>(
    type: K,
    listener: Listener<CanvasGlobalEvents[K]>,
  ): void {
    this.emitter.off(type, listener);
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
