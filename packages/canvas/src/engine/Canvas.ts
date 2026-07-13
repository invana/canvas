/**
 * `Canvas` — the engine root.
 *
 * Architecture: see `architecture-proposal.md` (whole document) and
 * `decorations-plan.md` §11.9 (RenderGroups + Ticker integration).
 *
 * **What it owns**
 *   - The pixi `Application` (created by `init`) and its `Ticker`.
 *   - The kernel `CanvasStore` (`view`/`data`/`events`/`theme`); `canvas.events`
 *     *is* the kernel's one canvas-wide `CanvasEventBus` (typed events + tap).
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
import {
  CanvasEventBus,
  createCanvasStore,
  type CanvasStore,
  type CanvasTelemetryConfig,
} from '@invana/canvas-store';

import { CanvasThemeState } from '../theme/CanvasThemeState';
import { Camera } from '../camera/Camera';
import { FrameMeter } from './FrameMeter';
import { InteractionTracker } from './InteractionTracker';
import { LayerRegistry } from '../registries/LayerRegistry';
import { BehaviourRegistry } from '../registries/BehaviourRegistry';
import { LayoutRegistry } from '../registries/LayoutRegistry';
import type { CanvasContext } from '../context/CanvasContext';
import { type CanvasConfig, configurable, deepMerge } from './CanvasConfig';
import { resolveRenderPreference } from './rendererSupport';
import {
  exportImage,
  exportImageDataURL,
  type ExportImageOptions,
} from '../export/imageExport';
import { exportSVG, type ExportSvgOptions } from '../export/svgExport';
import {
  exportCanvasState,
  importCanvasState,
  canvasStateToJSON,
  downloadCanvasState,
  importCanvasStateFromFile,
  type CanvasStateSnapshot,
  type CanvasStateSource,
  type ImportCanvasStateOptions,
} from '../export/stateExport';

/** High-resolution clock for per-frame timing; falls back to `Date.now` off-DOM. */
const perfNow = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

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

  /**
   * Preferred backend. Default `'webgpu'` (WebGPU-first).
   *
   * PixiJS's WebGPU renderer can crash at *render* time on some browser/driver
   * combinations (a null bind-group during pipeline setup), which no init-time
   * guard can catch. When that happens the engine halts its render loop and
   * emits `'canvas:renderer:fallback'` so the host can degrade to WebGL (the
   * `@invana/canvas-react` `<Canvas>` does this automatically). Pixi's own
   * auto-fallback still covers browsers with no WebGPU at all; pass `'webgl'`
   * explicitly to opt out of WebGPU entirely.
   */
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

  /**
   * Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
   * (see {@link CanvasTelemetryConfig}). Each stream `true` uses the dep-free
   * console adapter, so `telemetry: { traces: true, metrics: true }` works with
   * zero extra installs; inject a real port (or use the opt-in
   * `@invana/canvas-telemetry-otel` package) to export to OTLP / HyperDX. The
   * engine + kernel stay vendor-free — the exporter lives outside.
   *
   * `metrics` covers the per-frame FPS / phase stream the engine emits on
   * `render:loop:tick` (see {@link frames}); `traces` covers view-mutation,
   * event-bus, and per-gesture interaction spans.
   */
  telemetry?: CanvasTelemetryConfig;
}

// ─── Canvas ────────────────────────────────────────────────────────────────

export class Canvas {
  readonly id: string;
  readonly options: CanvasOptions;

  /**
   * The renderer-free kernel (`@invana/canvas-store`) — the observable truth this
   * engine projects. **`store.view.definition` is the single source of truth for
   * serialisable config**: {@link update} writes it and {@link get} reads it (no
   * parallel `this.config`). Readers subscribe to slices via `useStore`/`select`.
   *
   * The store owns `view`, `data`, `events` (the one canvas-wide bus — {@link events}
   * *is* `store.events`), `theme`, and `history`.
   */
  readonly store: CanvasStore;

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
  /**
   * Set once the WebGPU renderer has crashed at render time and we've halted the
   * loop + emitted `'canvas:renderer:fallback'`. Guards against repeating the
   * crash every frame while the host swaps to WebGL.
   */
  private _rendererFellBack = false;
  /** Last message pushed on the message channel; `null` when idle / cleared. */
  private _currentMessage: string | null = null;

  /**
   * Per-frame performance recorder — FPS + per-phase CPU breakdown for the last
   * N frames. Fed from {@link tickOnce}; read via {@link frames}. Always on (a
   * ring-buffer write per frame is near-free); an OTel adapter opts in by tapping
   * the `render:loop:tick` event this emits.
   */
  private readonly _frames = new FrameMeter();
  /** Attributes each frame to the active gesture so {@link _frames} can tag it. */
  private readonly _interactions: InteractionTracker;
  /** `performance.now()` at the previous frame — for the true (unclamped) frame time. */
  private _lastFrameTs = 0;

  constructor(opts: CanvasOptions = {}) {
    this.id = opts.id ?? 'canvas';
    this.options = opts;
    // The kernel owns the one canvas-wide bus; the engine converged onto it
    // (no separate engine bus). `canvas.events` *is* `store.events`.
    this.store = createCanvasStore(opts.telemetry ? { telemetry: opts.telemetry } : {});
    this.events = this.store.events;
    this.themeState = new CanvasThemeState(this.events);
    // Frame attribution reads the same bus; the meter (a field initialiser) is
    // fed per frame in `tickOnce`. Both always-on and near-free.
    this._interactions = new InteractionTracker(this.events);

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
    this.events.on('scene:layer:add', ({ id }) => {
      const slice = this.store.view.getState().definition.layers[id];
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
   * `'canvas:renderer:ready'` on the bus.
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

    // Resolve the backend before handing it to pixi. Default is `'webgpu'`
    // (WebGPU-first). `resolveRenderPreference` downgrades to `'webgl'` up front
    // where WebGPU is unusable; and if the WebGPU renderer instead crashes at
    // *render* time (uncatchable at init), the render-loop guard below halts the
    // loop and emits `'canvas:renderer:fallback'` so the host degrades to WebGL.
    // See `rendererSupport.ts`.
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
    // Pixi drives the frame render on its own ticker as usual — we don't touch
    // that path. To catch a WebGPU *render-time* crash (uncatchable at init) we
    // wrap the renderer's `render` method in place with a try/catch that routes
    // to `_handleRenderError`. Non-invasive: same render path, same timing, only
    // a guard added. See `_installRenderGuard`.
    this._installRenderGuard();

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

    this.events.emit('canvas:renderer:ready', {
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
    this.events.emit('canvas:renderer:ready', {
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
    // Frame timing: bracket each CPU phase with performance.now() so the meter
    // can report where the frame went (camera / dataFlush / layers). GPU render is
    // pixi's own pass, outside this tick, so it shows up as the `dt - cpuMs` remainder.
    const t0 = perfNow();
    // True (unclamped) inter-frame time. Pixi's `deltaMs` is floored at ~100ms
    // (ticker `minFPS`), so it under-reports big freezes (a 250ms layout stall
    // reads as 100ms) — measure the real gap ourselves. Fall back to the passed
    // delta on the first frame / when `tickOnce` is driven synchronously (tests).
    const dt = this._lastFrameTs > 0 && t0 - this._lastFrameTs > 0.5 ? t0 - this._lastFrameTs : deltaMs;
    this._lastFrameTs = t0;
    // Advance pixi-viewport plugins (decelerate, snap, etc.).
    this.camera.tick(deltaMs);
    const t1 = perfNow();
    // Drive every registered kernel data source's coalesced flush once per frame —
    // the single canvas clock (Phase 3.3). Drained BEFORE layers so a source's
    // delta marks its layer dirty in the same tick. Sources in their own
    // 'sync'/'frame' mode have usually already drained (flush() no-ops when nothing
    // is pending); sources the engine has put in 'manual' commit here.
    for (const id in this.store.data) this.store.data[id]?.flush();
    const t2 = perfNow();
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
    const t3 = perfNow();

    // Record + broadcast the frame. One small object per frame; the ring write
    // is amortised O(1). Consumers (OTel adapter, HUD) tap `render:loop:tick`
    // or pull from `this.frames`.
    const tick = this._frames.sample({
      ts: t0,
      dt,
      phases: { camera: t1 - t0, dataFlush: t2 - t1, layers: t3 - t2 },
      interaction: this._interactions.current(t0),
    });
    this.events.emit('render:loop:tick', tick);
  }

  /**
   * Frame-performance recorder — instantaneous + windowed FPS and the per-phase
   * CPU breakdown for the last N frames. Read it for a HUD (`canvas.frames.stats()`)
   * or subscribe to the per-frame `render:loop:tick` event for streaming.
   */
  get frames(): FrameMeter {
    return this._frames;
  }

  /**
   * Wrap the renderer's `render` method in place with a try/catch so a WebGPU
   * render-time crash (a null bind-group during pipeline setup, uncatchable at
   * init) routes to {@link _handleRenderError} instead of throwing uncaught out
   * of pixi's ticker every frame. Pixi still drives rendering exactly as before —
   * this only adds a guard, so it can't change what gets drawn.
   */
  private _installRenderGuard(): void {
    const renderer = this.app?.renderer;
    if (!renderer) return;
    const original = renderer.render.bind(renderer);
    renderer.render = ((...args: Parameters<typeof original>) => {
      if (this._rendererFellBack) return undefined as ReturnType<typeof original>;
      try {
        return original(...args);
      } catch (err) {
        this._handleRenderError(err);
        return undefined as ReturnType<typeof original>;
      }
    }) as typeof renderer.render;
  }

  /**
   * Recover from a render-time crash. On WebGPU: halt the render loop and emit
   * `'canvas:renderer:fallback'` **once** so the host re-inits on WebGL (the
   * `@invana/canvas-react` `<Canvas>` does this automatically). Any other backend
   * has nowhere to fall back to, so the error is re-thrown rather than swallowed.
   */
  private _handleRenderError(err: unknown): void {
    if (this._rendererFellBack || this._detectBackend() !== 'webgpu') throw err;
    this._rendererFellBack = true;
    // Stop the ticker so pixi's render loop can't re-hit the crash while the host
    // swaps backend.
    this.app?.ticker.stop();
    console.warn(
      '[canvas] WebGPU renderer crashed at render time; ' +
        'falling back to WebGL. Original error:',
      err,
    );
    this.events.emit('canvas:renderer:fallback', {
      from: 'webgpu',
      to: 'webgl',
      reason: 'render-error',
    });
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
   * Apply a JSON config patch. Writes `store.view.definition` (the source of
   * truth) and pushes each layer/behaviour slice to that instance's `setOptions`,
   * resolved by id (unknown ids no-op — register the instance first). Observers
   * subscribe to `store.view` slices (`useStore` / `select`) or `state:change`
   * rather than a coarse bus event.
   *
   * The config is pure JSON keyed by id — instances themselves are registered
   * imperatively (`canvas.layers.add(new XLayer({ id }))`).
   */
  update(patch: CanvasConfig): void {
    for (const [id, options] of Object.entries(patch.layers ?? {})) {
      configurable(this.layers.get(id))?.setOptions(options);
    }
    for (const [id, options] of Object.entries(patch.behaviours ?? {})) {
      configurable(this.behaviours.get(id))?.setOptions(options);
    }
    for (const [id, options] of Object.entries(patch.layouts ?? {})) {
      this.layouts.get(id)?.setOptions(options);
    }

    // `store.view.definition` is the single source of truth for serialisable
    // config (no parallel `this.config`). Per-id deep-merge so untouched slices
    // keep reference identity (idle slice-selectors don't wake).
    this.store.view.update((s) => {
      for (const [id, o] of Object.entries(patch.layers ?? {})) {
        s.definition.layers[id] = deepMerge(s.definition.layers[id] ?? {}, o) as Record<string, unknown>;
      }
      for (const [id, o] of Object.entries(patch.behaviours ?? {})) {
        s.definition.behaviours[id] = deepMerge(s.definition.behaviours[id] ?? {}, o) as Record<string, unknown>;
      }
      for (const [id, o] of Object.entries(patch.layouts ?? {})) {
        s.definition.layouts[id] = deepMerge(s.definition.layouts[id] ?? {}, o) as Record<string, unknown>;
      }
      if (patch.activeLayout !== undefined) s.definition.activeLayout = patch.activeLayout;
    }, 'canvas:update');
  }

  /**
   * Current serialisable config snapshot — drive a settings UI / save-load from
   * this. Projected from `store.view.definition` (the source of truth).
   */
  get(): CanvasConfig {
    const d = this.store.view.getState().definition;
    return {
      layers: d.layers,
      behaviours: d.behaviours,
      layouts: d.layouts,
      ...(d.activeLayout !== null ? { activeLayout: d.activeLayout } : {}),
    };
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
    const layerId = layout.targetLayerId ?? '';
    const offStart = layout.events.on('start', ({ nodeCount, edgeCount, animate }) => {
      this.events.emit('layout:run:start', {
        id: layout.id,
        layerId,
        nodeCount: nodeCount ?? 0,
        edgeCount: edgeCount ?? 0,
        animate: animate ?? false,
      });
    });
    const offEnd = layout.events.on('end', ({ reason }) => {
      this.events.emit('layout:run:end', {
        id: layout.id,
        layerId,
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
    const activeLayout = this.store.view.getState().definition.activeLayout;
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
    this.events.emit('canvas:message:show', { text, timeout });
  }

  /** Clear the current canvas message (emits `message` with `text: null`). */
  clearMessage(): void {
    this._currentMessage = null;
    this.events.emit('canvas:message:show', { text: null });
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

  // ─── Export ────────────────────────────────────────────────────────────────

  /**
   * Export the canvas as a raster image `Blob` (PNG / JPEG / WebP).
   *
   * Renders a region of the world container off-screen via the renderer's
   * `extract` system — `area: 'viewport'` (default) captures what's currently
   * visible at the on-screen zoom; `area: 'content'` captures the whole diagram
   * at native scale. Screen overlays (minimap, dev-info) are excluded; the
   * background is reproduced from the `background` option. See
   * {@link ExportImageOptions}.
   *
   * Rejects if called before {@link init} / in headless mode (no GPU renderer),
   * or when the capture region is empty. SVG export is a separate API (Phase 2).
   *
   * With `format: 'svg'` this returns a vector `image/svg+xml` blob via
   * {@link exportSVG} instead of a raster extract (see {@link exportSVGString}
   * for coverage notes).
   *
   * @example
   * const blob = await canvas.export({ format: 'png', area: 'content' });
   * const url = URL.createObjectURL(blob);
   */
  export(opts: ExportImageOptions = {}): Promise<Blob> {
    if (opts.format === 'svg') {
      const svg = this.exportSVGString(opts);
      return Promise.resolve(new Blob([svg], { type: 'image/svg+xml' }));
    }
    return exportImage(this, opts);
  }

  /**
   * Export the canvas as a **true vector SVG** string — a second projection of
   * the scene (shape specs + routed connector paths) into scalable markup,
   * independent of the GPU raster path. Resolution-independent and faithful for
   * geometric shapes, connectors, solid fills/strokes, composite cards, and
   * text labels.
   *
   * Not represented (use raster {@link export} when these matter): `image` /
   * `glyph` / `svg` fills, decorations other than labels, effects, and blur /
   * shadow filters — see `export/svgExport.ts`. Throws when the capture region
   * is empty. Unlike raster export this works headless (no GPU renderer needed).
   */
  exportSVGString(opts: ExportSvgOptions = {}): string {
    return exportSVG(this, opts);
  }

  /**
   * Export the canvas as a `data:` URL — the synchronous counterpart to
   * {@link export}, handy for `<img src>` / quick previews. Prefer {@link export}
   * for downloads (a `Blob` URL avoids a large base64 string). Same options and
   * throw conditions as {@link export}.
   */
  exportDataURL(opts: ExportImageOptions = {}): string {
    return exportImageDataURL(this, opts);
  }

  /**
   * Serialise the canvas's **full render state** to a plain JSON object — view
   * definition (scene / layers / behaviours / layouts / templates / theme +
   * styling), live interaction (selection / hover / camera / focus), and every
   * data-owning layer's records (nodes / edges with positions). The result is a
   * pure POJO safe to `JSON.stringify` / persist / diff.
   *
   * The state counterpart to {@link export} (which produces an *image*). Restore
   * with {@link importState}. Delegates to {@link exportCanvasState}.
   *
   * @example
   * const snapshot = canvas.exportState();
   * await fetch('/scene', { method: 'PUT', body: JSON.stringify(snapshot) });
   */
  exportState(): CanvasStateSnapshot {
    return exportCanvasState(this);
  }

  /**
   * Restore the canvas from a {@link CanvasStateSnapshot} produced by
   * {@link exportState}. Loads each layer's data, pushes the definition to the
   * registered instances, and restores the live interaction (unless
   * `skipInteraction`). The canvas's layers/behaviours/layouts must already be
   * registered under the snapshot's ids — import addresses instances by id, it
   * does not create them. Delegates to {@link importCanvasState}.
   */
  importState(snapshot: CanvasStateSnapshot, opts: ImportCanvasStateOptions = {}): void {
    importCanvasState(this, snapshot, opts);
  }

  /**
   * The current full canvas state as a JSON string (pretty-printed by default).
   * Sugar over `JSON.stringify(this.exportState(), null, space)`; delegates to
   * {@link canvasStateToJSON}.
   */
  stateToJSON(space: string | number = 2): string {
    return canvasStateToJSON(this, space);
  }

  /**
   * Serialise the full canvas state and trigger a browser download of the
   * `.json` file. No-op outside a DOM environment. Delegates to
   * {@link downloadCanvasState}.
   */
  downloadState(filename = 'canvas-state.json'): void {
    downloadCanvasState(this, filename);
  }

  /**
   * Restore the canvas from a {@link CanvasStateSnapshot}, a JSON string, or a
   * picked `File` / `Blob` (e.g. from an `<input type="file">`). Parses the
   * source then applies it like {@link importState}. Delegates to
   * {@link importCanvasStateFromFile}.
   */
  importStateFrom(source: CanvasStateSource, opts?: ImportCanvasStateOptions): Promise<void> {
    return importCanvasStateFromFile(this, source, opts);
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
    this._interactions.dispose();
    this.app?.ticker.remove(this.tick, this);
    this.layers?.clear();
    this.behaviours?.clear();
    this.layouts?.clear();
    this.camera?.dispose();
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
      store: this.store,
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
      store: this.store,
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
