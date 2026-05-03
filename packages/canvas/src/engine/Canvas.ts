/**
 * `Canvas` — the engine root.
 *
 * Architecture: see `architecture-proposal.md` (whole document) and
 * `decorations-plan.md` §11.9 (RenderGroups + Ticker integration).
 *
 * **What it owns**
 *   - The pixi `Application` (created by `init`) and its `Ticker`.
 *   - The `CanvasEventBus` (typed canvas-wide events + tap channel).
 *   - The `SurfaceManager` (world + screen RenderGroups).
 *   - The `Camera` (pan/zoom/projection).
 *   - The `LayerRegistry` and `BehaviourRegistry`.
 *   - The `CanvasContext` object handed to every Layer / Behaviour.
 *
 * **What it does per tick** (single RAF, delegated to pixi `Ticker`):
 *   1. Walk layers in z-order.
 *   2. Skip invisible layers.
 *   3. If a layer has pending dirty work, call `layer.flush()`.
 *   4. Pixi auto-renders the stage at end of tick.
 *
 * Animation runner (Tweens) and per-renderer animation ticks land in later
 * steps; this Canvas implementation has the hook points but doesn't yet
 * orchestrate them.
 *
 * **Two init paths**
 *   - `init(opts)` — the production path. Creates a pixi `Application`,
 *     mounts its canvas into the DOM container, hooks the ticker.
 *   - `initWithStage(stage, sw, sh)` — the test / headless path. Skips pixi
 *     `Application` entirely. Caller provides a `Container` (which can be
 *     a freshly-constructed pixi `Container()`) and viewport dimensions.
 *     Useful for unit tests that want to exercise the layer pipeline without
 *     standing up a renderer.
 */

import { Application, Container, type EventSystem, type Ticker } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { CanvasEventBus } from '../events/CanvasEventBus';
import { Camera } from '../camera/Camera';
import { LayerRegistry } from '../registries/LayerRegistry';
import { BehaviourRegistry } from '../registries/BehaviourRegistry';
import type { CanvasContext } from '../context/CanvasContext';

// ─── Options ───────────────────────────────────────────────────────────────

export interface CanvasOptions {
  /**
   * Stable identifier for this Canvas instance. Used as the source id on
   * envelopes published by the bus's own `emit()`. Default: `'canvas'`.
   * Override when running multiple Canvas instances in one document.
   */
  id?: string;

  /** DOM element pixi mounts its `<canvas>` into. Required by `init()`. */
  container?: HTMLElement;

  /** Preferred backend. Default `'webgpu'`. Pixi falls back via its own logic. */
  preference?: 'webgpu' | 'webgl' | 'canvas';

  /** Viewport width in CSS pixels. Default = `container.clientWidth`. */
  width?: number;
  /** Viewport height in CSS pixels. Default = `container.clientHeight`. */
  height?: number;

  /** Device pixel ratio. Default `window.devicePixelRatio`. */
  resolution?: number;

  /** GPU MSAA. Default `true`. Auto-disabled on the Canvas backend. */
  antialias?: boolean;

  /** `true` → opaque scene, `backgroundAlpha = 1` (skips per-frame blend). */
  opaque?: boolean;

  /** Background colour. Default `0` (black, but only visible when `opaque: true`). */
  backgroundColor?: number;

  /** GPU power preference. Default `'high-performance'`. */
  powerPreference?: 'high-performance' | 'low-power';

  /** Suppress pixi's "PixiJS X.X.X" startup log. Default `true`. */
  hello?: boolean;

  /**
   * Automatically resize the renderer and camera when the container element
   * changes size. Covers both window resize and programmatic expand/collapse.
   * Uses `ResizeObserver` internally. Default `false`.
   */
  autoResize?: boolean;
}

// ─── Canvas ────────────────────────────────────────────────────────────────

export class Canvas {
  readonly id: string;
  readonly options: CanvasOptions;

  /**
   * Public surface — populated by `init()` / `initWithStage()`. Accessing
   * before init throws (definite-assignment via `!`). Use `isInitialised`
   * to guard if needed.
   */
  readonly events: CanvasEventBus;
  /**
   * The world container — a `pixi-viewport` `Viewport` instance attached to
   * `app.stage`. Camera-transformed; `WorldLayer`s mount their roots here.
   * Typed as `Container` so consumers don't depend on `pixi-viewport`; reach
   * for the `Viewport`-specific API via `camera.viewport`.
   */
  world!: Container;

  /**
   * The pixi `Application.stage` (or, for `initWithStage`, the caller-
   * provided stage). `ScreenLayer`s mount their roots directly here, as
   * siblings of `world` — `world` is added first (bottom), each ScreenLayer
   * after (above). No "screen" wrapper container.
   */
  stage!: Container;
  camera!: Camera;
  layers!: LayerRegistry;
  behaviours!: BehaviourRegistry;
  context!: CanvasContext;

  private app?: Application;
  private _isInitialised = false;
  private _onRendererResize?: (w: number, h: number) => void;

  constructor(opts: CanvasOptions = {}) {
    this.id = opts.id ?? 'canvas';
    this.options = opts;
    this.events = new CanvasEventBus({ source: { kind: 'canvas', id: this.id } });
  }

  get isInitialised(): boolean {
    return this._isInitialised;
  }

  /** Pixi `Application`, available after `init()` (not `initWithStage`). */
  get application(): Application | undefined {
    return this.app;
  }

  // ─── Init paths ──────────────────────────────────────────────────────────

  /**
   * Production init: create a pixi `Application`, mount its canvas into the
   * supplied DOM container, wire the ticker, and emit
   * `'renderer:initialised'` on the bus.
   *
   * The selected backend (and capabilities) flows through the bus event so
   * consumers see which renderer pixi resolved.
   */
  async init(opts: CanvasOptions): Promise<void> {
    if (this._isInitialised) {
      throw new Error(`Canvas "${this.id}" already initialised`);
    }

    const container = opts.container;
    if (!container) throw new Error(`Canvas "${this.id}": init() requires a container element`);

    const width = opts.width ?? container.clientWidth;
    const height = opts.height ?? container.clientHeight;
    const dpr =
      opts.resolution ??
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1);

    this.app = new Application();
    await this.app.init({
      preference: opts.preference ?? 'webgpu',
      width,
      height,
      resolution: dpr,
      autoDensity: true,
      antialias: opts.antialias ?? true,
      backgroundAlpha: opts.opaque ? 1 : 0,
      backgroundColor: opts.backgroundColor ?? 0,
      powerPreference: opts.powerPreference ?? 'high-performance',
      hello: opts.hello ?? false,
      // When `autoResize` is on, let pixi own the resize loop. It polls
      // `container` on its ticker and calls `renderer.resize()` itself,
      // which is naturally frame-paced and handles `autoDensity` / DPR.
      // We just hook the renderer's `resize` event to keep camera in sync.
      ...(opts.autoResize ? { resizeTo: container } : {}),
    });

    this.app.canvas.style.display = 'block';
    container.appendChild(this.app.canvas);

    this._wireScene(this.app.stage, width, height, this.app.renderer.events);
    this.app.ticker.add(this.tick, this);

    if (opts.autoResize) {
      this._onRendererResize = (w, h) => {
        this.camera.resize(w, h);
      };
      this.app.renderer.on('resize', this._onRendererResize);
    }

    this._isInitialised = true;

    this.events.emit('renderer:initialised', {
      backend: this._detectBackend(),
      capabilities: this._capabilities(),
    });
  }

  /**
   * Headless / test init. Caller provides a pre-built stage `Container`
   * and viewport dimensions; we skip pixi's `Application` setup entirely.
   *
   * Use case: unit tests of the layer / behaviour / dirty / state pipeline
   * that don't need an actual GPU renderer.
   */
  initWithStage(stage: Container, screenWidth: number, screenHeight: number): void {
    if (this._isInitialised) {
      throw new Error(`Canvas "${this.id}" already initialised`);
    }
    this._wireScene(stage, screenWidth, screenHeight);
    this._isInitialised = true;
    this.events.emit('renderer:initialised', {
      backend: 'canvas', // headless == no GPU backend
      capabilities: { headless: true },
    });
  }

  // ─── Tick ────────────────────────────────────────────────────────────────

  /**
   * Run one tick manually with a fixed delta. Useful in tests; in production
   * pixi's ticker calls `tick` automatically.
   */
  tickOnce(deltaMs = 16): void {
    if (!this._isInitialised) return;
    // Advance pixi-viewport plugins (decelerate, snap, etc.).
    this.camera.tick(deltaMs);
    for (const layer of this.layers.byZOrder()) {
      if (!layer.visible) continue;
      if (layer.hasPending()) layer.flush();
      // Per architecture-proposal §2.7 + decorations-plan §3: animated
      // decorations (and any other per-frame primitive animation a Layer's
      // renderer owns) advance via a duck-typed `tickAnimations(dt)` hook.
      // The base `Layer` class doesn't declare it — Layers compose
      // renderers internally and may expose this hook conditionally.
      const ticker = (
        layer as unknown as {
          tickAnimations?: (dt: number) => void;
          renderer?: { tickAnimations?: (dt: number) => void };
        }
      );
      if (ticker.tickAnimations) {
        ticker.tickAnimations(deltaMs);
      } else if (ticker.renderer?.tickAnimations) {
        ticker.renderer.tickAnimations(deltaMs);
      }
    }
  }

  /** Pixi ticker callback. Bound via `add(this.tick, this)`. */
  private tick(ticker: Ticker): void {
    this.tickOnce(ticker.deltaMS);
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  /**
   * Tear down everything: ticker callback, registries (which unmount their
   * Layers / destroy their Behaviours and any ScreenLayer roots they own),
   * the world subtree, bus subscriptions, pixi Application. Idempotent.
   */
  destroy(): void {
    if (!this._isInitialised) return;

    if (this._onRendererResize && this.app) {
      this.app.renderer.off('resize', this._onRendererResize);
    }
    this._onRendererResize = undefined;
    this.app?.ticker.remove(this.tick, this);
    this.layers?.clear();
    this.behaviours?.clear();
    this.world?.destroy({ children: true });
    this.events.clearTaps();
    this.events.removeAllListeners();

    if (this.app) {
      // Pixi destroys the renderer + canvas + ticker.
      this.app.destroy(true, { children: true });
      this.app = undefined;
    }
    this._isInitialised = false;
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private _wireScene(
    stage: Container,
    screenWidth: number,
    screenHeight: number,
    events?: EventSystem,
  ): void {
    // The world container is always a `Viewport` instance — its position /
    // scale is what `Camera` mutates. In headless tests no real `EventSystem`
    // is available, so we pass a minimal stub. Viewport stores `events` but
    // doesn't actively use `events.domElement` unless an input plugin is
    // enabled (which we don't do in headless).
    const eventsForViewport: EventSystem =
      events ??
      ({
        domElement:
          typeof document !== 'undefined'
            ? document.createElement('canvas')
            : ({} as HTMLCanvasElement),
      } as unknown as EventSystem);

    const viewport = new Viewport({
      events: eventsForViewport,
      screenWidth,
      screenHeight,
      // Canvas owns the tick loop (`this.tick`); don't auto-register on the
      // global pixi Ticker. We'll forward `deltaMS` into `viewport.update()`
      // when camera-input behaviours that animate (decelerate, snap, etc.)
      // land in a follow-up.
      noTicker: true,
    });
    viewport.label = 'world';
    this.world = viewport;
    this.stage = stage;

    // World goes in first → bottom. ScreenLayers attach themselves to `stage`
    // directly later, so they're added after world and draw on top.
    stage.addChild(this.world);

    this.camera = new Camera({
      viewport,
      screenWidth,
      screenHeight,
      bus: this.events,
    });

    this.layers = new LayerRegistry({
      getContext: () => this.context,
      bus: this.events,
    });
    this.behaviours = new BehaviourRegistry({
      getContext: () => this.context,
      bus: this.events,
    });

    // Build the context object now that all dependencies exist.
    this.context = {
      events: this.events,
      world: this.world,
      stage: this.stage,
      camera: this.camera,
      layers: this.layers,
      behaviours: this.behaviours,
    };
  }

  private _detectBackend(): 'webgpu' | 'webgl' | 'canvas' {
    if (!this.app) return 'canvas';
    // Pixi v8 renderers expose a `name` string.
    const name = (this.app.renderer as { name?: string }).name;
    if (name === 'webgpu' || name === 'webgl' || name === 'canvas') return name;
    const ctor = this.app.renderer.constructor.name.toLowerCase();
    if (ctor.includes('webgpu')) return 'webgpu';
    if (ctor.includes('webgl')) return 'webgl';
    return 'canvas';
  }

  private _capabilities(): Record<string, unknown> {
    if (!this.app) return { headless: true };
    return {
      backend: this._detectBackend(),
      resolution: this.app.renderer.resolution,
      width: this.app.renderer.width,
      height: this.app.renderer.height,
    };
  }
}
