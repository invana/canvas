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
import { CanvasThemeState } from '../theme/CanvasThemeState';
import { Camera } from '../camera/Camera';
import { LayerRegistry } from '../registries/LayerRegistry';
import { BehaviourRegistry } from '../registries/BehaviourRegistry';
import { LayoutRegistry } from '../registries/LayoutRegistry';
import type { CanvasContext } from '../context/CanvasContext';
import { type CanvasConfig, configurable, deepMerge } from './CanvasConfig';
import { resolveRenderPreference } from './rendererSupport';

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

  /**
   * Suppress the browser's native right-click context menu on the canvas
   * element. Diagram apps typically want to show their own menu UI via the
   * `shape:contextmenu` / `connector:contextmenu` events. Default `true`.
   *
   * Set to `false` if the app wants the OS context menu (e.g. for
   * accessibility / dev tooling on right-click).
   */
  suppressBrowserContextMenu?: boolean;

  /**
   * Serialisable visual config applied at the end of `init()` to the
   * layers/behaviours already added (by id): each slice is pushed to the
   * instance's `setOptions`, and behaviours with `enabled: true` are turned on.
   * The single place to set all settings. Pure JSON — see {@link CanvasConfig}.
   */
  config?: CanvasConfig;
}

// ─── Canvas ────────────────────────────────────────────────────────────────

export class Canvas {
  readonly id: string;
  readonly options: CanvasOptions;

  /** Serialisable visual config, keyed by instance id. Patched via {@link update}. */
  private config: CanvasConfig = {};

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
  readonly layers: LayerRegistry;
  readonly behaviours: BehaviourRegistry;
  readonly layouts: LayoutRegistry;
  context!: CanvasContext;

  /**
   * The shared theme channel — a single publisher (the domain `ThemeBehaviour`)
   * sets the resolved theme here and every theme-aware layer recolours from it.
   * Lives for the whole `Canvas` lifetime (the bus already exists at construct).
   */
  private readonly themeState: CanvasThemeState;

  private app?: Application;
  private _isInitialised = false;
  private _onRendererResize?: (w: number, h: number) => void;
  private _resizeObserver?: ResizeObserver;
  /** Last message pushed on the message channel; `null` when idle / cleared. */
  private _currentMessage: string | null = null;

  constructor(opts: CanvasOptions = {}) {
    this.id = opts.id ?? 'canvas';
    this.options = opts;
    this.events = new CanvasEventBus({ source: { kind: 'canvas', id: this.id } });
    this.themeState = new CanvasThemeState(this.events);

    // Registries exist from construction so layers/behaviours can be added
    // *before* `init()`. `getContext` returns `undefined` until init builds the
    // context, at which point `init` mounts/wires everything added so far.
    this.layers = new LayerRegistry({ getContext: () => this.context, bus: this.events });
    this.behaviours = new BehaviourRegistry({ getContext: () => this.context, bus: this.events });
    this.layouts = new LayoutRegistry({ bus: this.events });

    // A layer registered *after* config was already pushed (e.g. a React-mounted
    // `<MiniMapLayer>` that lands after `<SystemTheme>` has already called
    // `update()`) would otherwise miss that config — `update()` only reaches
    // instances registered at call time. Re-apply the accumulated slice on every
    // `layer:added` so late arrivals adopt the current theme/options. Pre-init
    // adds carry an empty config so this no-ops there; `_activate`'s `update()`
    // configures them instead.
    this.events.on('layer:added', ({ id }) => {
      const slice = this.config.layers?.[id];
      if (slice) configurable(this.layers.get(id))?.setOptions(slice);
    });
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

    // Resolve the backend before handing it to pixi. `resolveRenderPreference`
    // downgrades `'webgpu'` → `'webgl'` on browsers where pixi's WebGPU renderer
    // is broken (WebKit) but advertises support — pixi's own auto-fallback only
    // covers browsers with *no* WebGPU, so without this the canvas would crash at
    // render time. See `rendererSupport.ts`.
    const preference = resolveRenderPreference(opts.preference ?? 'webgpu');
    const initOpts = {
      width,
      height,
      resolution: dpr,
      autoDensity: true,
      antialias: opts.antialias ?? true,
      backgroundAlpha: opts.opaque ? 1 : 0,
      backgroundColor: opts.backgroundColor ?? 0,
      powerPreference: opts.powerPreference ?? 'high-performance',
      hello: opts.hello ?? false,
      // When `autoResize` is on, point pixi's ResizePlugin at `container` so its
      // `resize()` reads the element's `clientWidth/clientHeight` and handles
      // `autoDensity` / DPR. The plugin only re-runs on the *window* `resize`
      // event though — it never observes the element — so element-only size
      // changes (e.g. a side panel resizing the canvas host without resizing the
      // window) are picked up by the `ResizeObserver` wired below instead.
      ...(opts.autoResize ? { resizeTo: container } : {}),
    };

    this.app = new Application();
    try {
      await this.app.init({ preference, ...initOpts });
    } catch (err) {
      // Defense in depth for the case `resolveRenderPreference` can't predict: a
      // non-WebKit browser that advertises WebGPU but throws *during* init (e.g.
      // a blocklisted adapter / driver). Tear the half-built app down and retry
      // once on WebGL. (WebKit's failure is at render time, not init, so it never
      // reaches here — that's why the preference must be resolved up front.)
      if (preference !== 'webgpu') throw err;
      this.app.destroy(true);
      this.app = new Application();
      await this.app.init({ preference: 'webgl', ...initOpts });
    }

    this.app.canvas.style.display = 'block';
    container.appendChild(this.app.canvas);

    if (opts.suppressBrowserContextMenu ?? true) {
      this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    this._wireScene(this.app.stage, width, height, this.app.renderer.events);
    this.app.ticker.add(this.tick, this);

    if (opts.autoResize) {
      this._onRendererResize = (w, h) => {
        this.camera.resize(w, h);
      };
      this.app.renderer.on('resize', this._onRendererResize);

      // Pixi's ResizePlugin only listens for the window `resize` event, so it
      // misses element-only size changes (panel drags, flex reflow, programmatic
      // expand/collapse). Observe the container and queue a pixi resize — which
      // reads the container's current size and emits the `resize` event the
      // camera-sync handler above hangs off — on every change. `queueResize`
      // defers to the next frame and dedupes, so rapid drag ticks coalesce.
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => this.app?.queueResize());
        this._resizeObserver.observe(container);
      }
    }

    this._isInitialised = true;

    this.events.emit('renderer:initialised', {
      backend: this._detectBackend(),
      capabilities: this._capabilities(),
    });

    this._activate(opts.config);
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

    this._activate(this.options.config);
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

  // ─── Serialisable config ────────────────────────────────────────────────

  /**
   * Run at the end of `init()`: mount every layer added so far, wire every
   * behaviour (layers first so behaviour `onRegister` finds them mounted), then
   * apply the init `config` and enable the behaviours it flags.
   */
  private _activate(config?: CanvasConfig): void {
    this.layers.mountAll();
    this.behaviours.registerAll();
    if (!config) return;
    this.update(config);
    for (const [id, options] of Object.entries(config.behaviours ?? {})) {
      if ((options as { enabled?: boolean }).enabled) this.behaviours.setEnabled(id, true);
    }
  }

  /**
   * Apply a JSON config patch. Deep-merges into the held config, then pushes
   * each layer/behaviour slice to that instance's `setOptions`, resolved by id
   * (unknown ids no-op — register the instance first). Emits one
   * `options:change` so observers (e.g. a settings UI) can re-read via {@link get}.
   *
   * The config is pure JSON keyed by id — instances themselves are registered
   * imperatively (`canvas.layers.add(new XLayer({ id }))`).
   */
  update(patch: CanvasConfig): void {
    this.config = deepMerge(this.config, patch) as CanvasConfig;

    for (const [id, options] of Object.entries(patch.layers ?? {})) {
      configurable(this.layers.get(id))?.setOptions(options);
    }
    for (const [id, options] of Object.entries(patch.behaviours ?? {})) {
      configurable(this.behaviours.get(id))?.setOptions(options);
    }
    for (const [id, options] of Object.entries(patch.layouts ?? {})) {
      this.layouts.get(id)?.setOptions(options);
    }

    this.events.emit('options:change', {
      changedLayerIds: Object.keys(patch.layers ?? {}),
      changedBehaviourIds: Object.keys(patch.behaviours ?? {}),
    });
  }

  /** Current serialisable config snapshot — drive a settings UI / save-load from this. */
  get(): CanvasConfig {
    return this.config;
  }

  /**
   * Run a registered layout against the layer named by its `targetLayerId`.
   * No-op if the layout or its target layer isn't found. Layouts run against
   * data, so call this after the target layer has data.
   */
  runLayout(id: string): Promise<void> {
    const layout = this.layouts.get(id);
    const target = layout?.targetLayerId ? this.layers.get(layout.targetLayerId) : undefined;
    if (!layout || !target) return Promise.resolve();

    // Bridge the layout's own (canvas-agnostic) lifecycle events onto the
    // canvas bus as typed run-lifecycle events. This is the one place that
    // holds both the layout and the bus, so the Layout contract stays free of
    // any canvas reference (proposal §2.3). Subscribed before `apply()` —
    // which emits `start` synchronously — and torn down when the run resolves.
    const offStart = layout.events.on('start', ({ nodeCount, edgeCount, animate }) => {
      this.events.emit('layout:run:start', {
        id: layout.id,
        nodeCount: nodeCount ?? 0,
        edgeCount: edgeCount ?? 0,
        animate: animate ?? false,
      });
    });
    const offEnd = layout.events.on('end', ({ reason }) => {
      this.events.emit('layout:run:end', {
        id: layout.id,
        reason: reason === 'completed' ? 'settled' : 'stopped',
      });
    });

    return layout.apply(target as never).finally(() => {
      offStart();
      offEnd();
    });
  }

  /**
   * Repaint every layer from its current state — calls {@link Layer.redraw} on
   * each (a no-op for layers that don't override it). A pure render pass:
   * positions and data are untouched. Use after an external style/theme change
   * that bypassed the per-layer dirty path, or to recover from a suspected
   * render desync. For layout re-positioning use {@link runLayout}; for both at
   * once use {@link refresh}.
   */
  redraw(): void {
    for (const layer of this.layers.byZOrder()) layer.redraw();
  }

  /**
   * Full refresh: re-run the active layout (`config.activeLayout`) to
   * re-position items, then {@link redraw} every layer. The single call behind
   * a toolbar "re-render" button — re-layout + repaint in one. Resolves once
   * the layout settles; the layout step is skipped when no `activeLayout` is set.
   */
  async refresh(): Promise<void> {
    const activeLayout = this.config.activeLayout;
    if (activeLayout) await this.runLayout(activeLayout);
    this.redraw();
  }

  // ─── Message channel ───────────────────────────────────────────────────────

  /**
   * Show a transient message on the shared canvas message channel — emits a
   * `message` event for a status surface (e.g. canvas-react's `CanvasMessageBar`)
   * to display. Last-write-wins: a newer message replaces the current one. With
   * `timeout` (ms) the surface auto-clears it after that delay; without, it
   * stays until replaced or {@link clearMessage}-ed. Reachable from layers /
   * behaviours / layouts too, via `ctx.showMessage`.
   */
  showMessage(text: string, timeout?: number): void {
    this._currentMessage = text;
    this.events.emit('message', { text, timeout });
  }

  /** Clear the current canvas message (emits `message` with `text: null`). */
  clearMessage(): void {
    this._currentMessage = null;
    this.events.emit('message', { text: null });
  }

  /**
   * The message currently on the channel, or `null` when idle. Stored so a
   * status surface that subscribes *after* a message was pushed (e.g. a footer
   * `CanvasMessageBar` mounting once the engine is ready) can show the current
   * line instead of missing the one-shot `message` event. Note: a `timeout`ed
   * message is auto-cleared by the displaying surface, not the engine, so this
   * keeps reporting it until replaced or {@link clearMessage}-ed.
   */
  get currentMessage(): string | null {
    return this._currentMessage;
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
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this.app?.ticker.remove(this.tick, this);
    this.layers?.clear();
    this.behaviours?.clear();
    this.layouts?.clear();
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

    // Default the camera so world (0, 0) sits at the centre of the screen.
    // Most diagram / graph content positions itself around the origin
    // (e.g. d3-force's `forceCenter` defaults to 0, 0), so a top-left
    // anchor leaves content drifting in from the corner on boot. Callers
    // who want top-left semantics can `camera.setPosition(0, 0)` after init.
    this.camera.setPosition(screenWidth / 2, screenHeight / 2);

    // Build the context object now that all dependencies exist. The registries
    // were created in the constructor; they pick up this context via their
    // `getContext` thunk the moment it's assigned here.
    this.context = {
      events: this.events,
      theme: this.themeState,
      world: this.world,
      stage: this.stage,
      camera: this.camera,
      layers: this.layers,
      behaviours: this.behaviours,
      canvasElement: this.app?.canvas,
      showMessage: (text, timeout) => this.showMessage(text, timeout),
      clearMessage: () => this.clearMessage(),
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
