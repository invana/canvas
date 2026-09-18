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
 *   - `initWithRenderer(renderer, sw, sh)` — the headless path. The caller
 *     supplies an already-mounted backend, so a test can drive the whole layer
 *     / behaviour / state pipeline against a renderer that draws nothing.
 */

import type { IRenderer, RenderPreference } from '@invana/canvas-core';
import {
  CanvasEventBus,
  createCanvasStore,
  createReactiveStore,
  type CanvasStore,
  type CanvasTelemetryConfig,
} from '@invana/canvas-store';
import { createDefaultRenderer } from '@invana/renderer-pixijs';

import { CanvasThemeState } from '@invana/canvas-store';
import { Camera } from '@invana/canvas-core';
import { DefaultGestureArbiter, type GestureArbiter } from '@invana/canvas-core';
import type { Rect } from '@invana/canvas-store';
import { FrameMeter } from './FrameMeter';
import { InteractionTracker } from './InteractionTracker';
import { LayerRegistry } from '@invana/canvas-core';
import { BehaviourRegistry } from '@invana/canvas-core';
import { LayoutRegistry } from '@invana/canvas-core';
import type { CanvasContext } from '@invana/canvas-core';
import type { ISurface } from '@invana/canvas-core';
import { Tween, resolveEasing, type EasingName } from '@invana/canvas-core';
import { type CanvasConfig, configurable, deepMerge } from './CanvasConfig';
import {
  exportImage,
  exportImageDataURL,
  type ExportImageOptions,
} from '../io/imageExport';
import { exportSVG, type ExportSvgOptions } from '../io/svgExport';
import {
  exportCanvasState,
  importCanvasState,
  canvasStateToJSON,
  downloadCanvasState,
  importCanvasStateFromFile,
  type CanvasStateSnapshot,
  type CanvasStateSource,
  type ImportCanvasStateOptions,
} from '../io/stateExport';

/** High-resolution clock for per-frame timing; falls back to `Date.now` off-DOM. */
const perfNow = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

/**
 * Viewport-cull margin as a fraction of the larger visible dimension. A buffer
 * so shapes just past the screen edge are already rendered before a pan brings
 * them in — trades a little culling reach for no pop-in.
 */
const CULL_PAD_FRACTION = 0.15;

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
   * Preferred backend ({@link RenderPreference}). Default `'webgpu'`
   * (WebGPU-first). Passed to the renderer verbatim — `'canvas'` mounts the 2D
   * backend rather than being folded into `'webgl'`.
   *
   * PixiJS's WebGPU renderer can crash at *render* time on some browser/driver
   * combinations (a null bind-group during pipeline setup), which no init-time
   * guard can catch. When that happens the engine halts its render loop and
   * emits `'canvas:renderer:fallback'` so the host can degrade to WebGL (the
   * `@invana/canvas-react` `<Canvas>` does this automatically). Pixi's own
   * auto-fallback still covers browsers with no WebGPU at all; pass `'webgl'`
   * explicitly to opt out of WebGPU entirely.
   */
  preference?: RenderPreference;

  /**
   * The drawing backend. Defaults to `@invana/renderer-pixijs` (the PixiJS
   * backend); supply one to override — a three.js backend, or
   * `HeadlessRenderer` for a test.
   *
   * When supplied, `Canvas` calls `mount` on it; you do not mount it yourself.
   */
  renderer?: IRenderer;

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
   * Public surface — populated by `init()` / `initWithRenderer()`. Accessing
   * before init throws (definite-assignment via `!`). Use `isInitialised`
   * to guard if needed.
   */
  readonly events: CanvasEventBus;

  camera!: Camera;

  /**
   * Pointer-gesture arbitration for this canvas — see `input/GestureArbiter.ts`.
   * Built in the constructor (no dependency on the scene graph) so it is live
   * before any behaviour registers, and handed to every participant as
   * `ctx.gestures`.
   */
  readonly gestures: GestureArbiter;
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

  /**
   * The drawing backend. `Canvas` drives it through {@link IRenderer} and owns
   * no pixi object of its own — the `Application`, the viewport, the surfaces
   * and the texture pool all live behind this.
   */
  private _renderer?: IRenderer;
  /** Handle for the engine's own rAF loop. Set while initialised (G3). */
  private _rafHandle: number | null = null;
  private _isInitialised = false;
  /** True once this canvas has acquired the shared TexturePool (real `init` only). */
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
  /** Guards {@link _armAutoFit} against attaching duplicate follow listeners
   *  when `config.fitOnLoad: true` is applied more than once. */
  private _autoFitArmed = false;
  /** Pending grace timer from {@link _armAutoFit} — fires only if the declared
   *  `activeLayout` never reports a run. Cleared on the first run and on destroy. */
  private _autoFitGrace: ReturnType<typeof setTimeout> | undefined;
  /** Rounded visible-bounds key from the last cull — re-cull only when it changes. */
  private _lastCullKey = '';

  /**
   * Every **world** surface handed out by {@link _buildContext}'s factory, in
   * creation order. The entrance fades these and only these: screen-fixed
   * chrome blinking in reads as a glitch.
   *
   * Tracked here rather than walked off the layers because a surface is the
   * thing with an alpha, and a layer need not expose its own.
   */
  private readonly _worldSurfaces: Set<ISurface> = new Set();
  /**
   * Entrance state machine, or `null` when `config.entrance` is absent (the
   * default — nothing is armed and no alpha is ever written).
   *
   * `armed` means the world is being held at alpha 0 waiting for the trigger;
   * `tween` is non-null only while the fade is actually running. Once `played`
   * is true the entrance never fires again for this canvas's life.
   */
  private _entrance: {
    readonly durationMs: number;
    readonly easing: EasingName | undefined;
    armed: boolean;
    played: boolean;
    tween: Tween | null;
    grace: ReturnType<typeof setTimeout> | undefined;
  } | null = null;
  /** `config.fitAnimation`, applied to the first auto-fit only. */
  private _fitAnimation: { durationMs?: number; easing?: EasingName } | undefined;
  /** False until the auto-fitter has issued its first fit — gates {@link _fitAnimation}. */
  private _firstFitDone = false;


  constructor(opts: CanvasOptions = {}) {
    this.id = opts.id ?? 'canvas';
    this.options = opts;
    // The kernel owns the one canvas-wide bus; the engine converged onto it
    // (no separate engine bus). `canvas.events` *is* `store.events`.
    this.store = createCanvasStore(opts.telemetry ? { telemetry: opts.telemetry } : {});
    this.events = this.store.events;
    this.themeState = new CanvasThemeState(this.events);
    this.gestures = new DefaultGestureArbiter();
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

  /**
   * The mounted drawing backend, or `undefined` before `init()`.
   *
   * Replaces the old `application` getter, which handed out pixi's
   * `Application` and could not survive the backend split — a getter typed in
   * pixi nouns forces every consumer to know which backend is mounted. Reach
   * for a *capability* (`renderer.capabilities`, `renderer.extract?.()`)
   * instead; if you genuinely need the pixi object, narrow the backend
   * yourself with an `instanceof PixiRenderer` at the call site.
   */
  get renderer(): IRenderer | undefined {
    return this._renderer;
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

    // Standing the backend up — the drawing surface, its GPU fallback, the
    // texture pool, the crash guard, the resize plumbing — is entirely the
    // renderer's job. `Canvas` asks for devices and imports no drawing library.
    //
    // The default backend is `@invana/renderer-pixijs`, a required dependency
    // of the engine imported at module scope above: it ships with the engine so
    // `init()` works with no configuration. A consumer bringing their own
    // backend passes it via `opts.renderer`.
    const renderer = opts.renderer ?? createDefaultRenderer({ events: this.events });
    this._renderer = renderer;
    await renderer.mount(container, {
      ...(opts.preference ? { preference: opts.preference } : {}),
      ...(opts.width !== undefined ? { width: opts.width } : {}),
      ...(opts.height !== undefined ? { height: opts.height } : {}),
      ...(opts.resolution !== undefined ? { resolution: opts.resolution } : {}),
      ...(opts.antialias !== undefined ? { antialias: opts.antialias } : {}),
      ...(opts.backgroundColor !== undefined ? { background: opts.backgroundColor } : {}),
      ...(opts.powerPreference !== undefined ? { powerPreference: opts.powerPreference } : {}),
      ...(opts.opaque !== undefined ? { opaque: opts.opaque } : {}),
      ...(opts.autoResize !== undefined ? { autoResize: opts.autoResize } : {}),
      ...(opts.suppressBrowserContextMenu !== undefined
        ? { suppressBrowserContextMenu: opts.suppressBrowserContextMenu }
        : {}),
    });

    const width = opts.width ?? container.clientWidth;
    const height = opts.height ?? container.clientHeight;
    this._wireScene(width, height);
    this._startFrameLoop();

    this._isInitialised = true;

    this.events.emit('canvas:renderer:ready', {
      backend: renderer.backend,
      capabilities: { ...renderer.capabilities },
    });

    // Note: fit-on-load is armed inside `update()` (the universal config-apply
    // path), not here — the React root omits `config` from `init()` and applies it
    // via `update()` afterwards, so arming here would miss it.
    this._activate(opts.config);
  }

  /**
   * Init against a renderer the caller already built and mounted — the seam for
   * a **headless** backend, and the reason the engine's own test suite needs no
   * drawing library.
   *
   * Synchronous on purpose. {@link init} resolves its default backend with a
   * lazy `import()` and is therefore async; this path takes the renderer as an
   * argument instead, so it stays callable from a plain test body.
   *
   * The caller owns the renderer's `mount` — this only wires the camera, the
   * context and the layer/behaviour registries on top of it.
   */
  initWithRenderer(renderer: IRenderer, screenWidth: number, screenHeight: number): void {
    if (this._isInitialised) {
      throw new Error(`Canvas "${this.id}" already initialised`);
    }
    this._renderer = renderer;
    this._wireScene(screenWidth, screenHeight);
    this._startFrameLoop();
    this._isInitialised = true;
    this.events.emit('canvas:renderer:ready', {
      backend: renderer.backend,
      capabilities: { ...renderer.capabilities },
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
    // Advance pixi-viewport plugins (decelerate, snap, etc.) and any camera
    // glide from `config.fitAnimation`.
    this.camera.tick(deltaMs);
    // The canvas entrance (`config.entrance`) — one alpha write per world
    // surface while it runs, and nothing at all otherwise.
    this._tickEntrance(dt);
    const t1 = perfNow();
    // Drive every registered kernel data source's coalesced flush once per frame —
    // the single canvas clock (Phase 3.3). Drained BEFORE layers so a source's
    // delta marks its layer dirty in the same tick. Sources in their own
    // 'sync'/'frame' mode have usually already drained (flush() no-ops when nothing
    // is pending); sources the engine has put in 'manual' commit here.
    for (const id in this.store.data) this.store.data[id]?.flush();
    const t2 = perfNow();
    // Viewport culling — recompute the on-screen working set only when the
    // camera actually moved (rounded visible-bounds key), so a still graph pays
    // nothing. Off-screen shapes/connectors get `renderable = false` and skip
    // Pixi's render pass; the pad keeps a margin so elements don't pop at the
    // edge mid-pan. Per-layer, gated by the `cullable` flag.
    const visBounds = this.camera.getVisibleBounds();
    const cullKey = `${Math.round(visBounds.x)},${Math.round(visBounds.y)},${Math.round(visBounds.width)},${Math.round(visBounds.height)}`;
    const cameraMoved = cullKey !== this._lastCullKey;
    if (cameraMoved) this._lastCullKey = cullKey;
    const cullPad = Math.max(visBounds.width, visBounds.height) * CULL_PAD_FRACTION;

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
          renderer?: {
            tickAnimations?: (dt: number) => void;
            cull?: (bounds: Rect, pad?: number) => void;
          };
        }
      );
      if (ticker.tickAnimations) {
        ticker.tickAnimations(deltaMs);
      } else if (ticker.renderer?.tickAnimations) {
        ticker.renderer.tickAnimations(deltaMs);
      }
      if (cameraMoved && layer.cullable) ticker.renderer?.cull?.(visBounds, cullPad);
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
   * Fit the camera to all content — zoom + centre so every world layer's content
   * fits the viewport (the "zoom to extent" action; the same
   * `camera.fitContent` the Fit toolbar button calls, over the union of layers).
   * No-op when there's nothing with real extent to fit.
   *
   * @param padding Screen-px margin around the content. Default `80`.
   */
  fitView(padding = 80): void {
    const rect = this._contentBounds();
    if (rect) this.camera.fitContent(rect, padding);
  }

  /**
   * {@link fitView}, eased — glide to the fitted transform instead of snapping.
   * Used for the first auto-fit when `config.fitAnimation` is set.
   *
   * Solves for the same transform `Camera.fitContent` would write, then hands it
   * to `Camera.animateTo` rather than applying it. Any user camera write during
   * the glide cancels it.
   */
  private _fitViewAnimated(
    opts: { durationMs?: number; easing?: EasingName },
    padding = 80,
  ): void {
    const rect = this._contentBounds();
    if (!rect) return;
    const cam = this.camera;
    const availW = Math.max(1, cam.screenWidth - padding * 2);
    const availH = Math.max(1, cam.screenHeight - padding * 2);
    const zoom = Math.min(availW / Math.max(1, rect.width), availH / Math.max(1, rect.height));
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    cam.animateTo(
      { x: cam.screenWidth / 2 - cx * zoom, y: cam.screenHeight / 2 - cy * zoom, zoom },
      {
        ...(opts.durationMs !== undefined ? { durationMs: opts.durationMs } : {}),
        ...(opts.easing !== undefined ? { easing: opts.easing } : {}),
      },
    );
  }

  /**
   * Whether `config.fitOnLoad` has armed the engine's auto-fitter — i.e. whether
   * **this canvas already owns framing**.
   *
   * Read it before fitting the camera from outside the engine (a layout wrapper,
   * an app shell). The auto-fitter frames on the same `layout:run:end` a layout
   * consumer would, using the union of *every* world layer's bounds; a second
   * owner writing the transform with a different padding lands as an extra
   * visible hop after the graph has already settled. The engine is the better
   * owner of the two — it is the only one that can see the other layers.
   */
  get autoFitArmed(): boolean {
    return this._autoFitArmed;
  }

  /**
   * Arm `config.fitOnLoad`: keep the view framed on the graph as its layout
   * runs. With no `activeLayout`, this is a single fit on the next frame (the
   * extra frame lets a just-loaded scene flush before {@link fitView} reads its
   * bounds).
   *
   * With an `activeLayout`, the layout owns the positions, so we frame it around
   * every **run**. An **animated** layout keeps expanding as it settles, so a
   * single end-fit would frame an intermediate (smaller) state and leave nodes
   * spilling outside once the graph grows — so we *follow* the run: re-fit
   * (throttled — a live sim ticks every frame) on each `layout:run:tick`, then an
   * exact fit on `layout:run:end`/`settled`. A static layout ticks ~once then
   * ends, degrading to the same single settle-fit.
   *
   * Scope is the **active layout's `runLayout` calls** — the initial load and
   * engine re-runs (topology change / {@link refresh}). Gating on the layout id
   * (not on catching `start`) means we still follow a run already in flight when
   * arming lands. Crucially, the bridged `layout:run:*` events only flow while a
   * `runLayout` is in flight (torn down on settle); a live **drag** / hover /
   * `setOptions` re-heat re-`apply()`s the layout *directly*, without
   * re-bridging, so it never reaches the bus and the camera stays put during
   * interaction. Listeners live for the canvas lifetime (cleared by `destroy`'s
   * `removeAllListeners`); {@link _autoFitArmed} keeps a repeated
   * `fitOnLoad: true` from attaching duplicates.
   */
  private _armAutoFit(): void {
    if (this._autoFitArmed) return;
    this._autoFitArmed = true;

    /**
     * Fit, then fit again once the data actually reaches the renderer.
     *
     * A layout writes positions to the **store**; the store is frame-coalesced,
     * so the renderer only learns them on its next flush — which lands *after*
     * the `layout:run:end` that triggers this fit. Fitting once therefore
     * measures shapes still sitting where they were first drawn (typically all
     * stacked at the origin) and frames a box the size of a single node: the
     * runaway zoom that reads as "the graph didn't render".
     *
     * Waiting a fixed number of frames doesn't fix it — the box is *stably
     * wrong* until the flush lands, so any "it stopped changing" test ends the
     * watch on the bad value. The flush itself is the signal, so listen for it:
     * `data:flush` is emitted per layer delta on this same bus, and one arrives
     * exactly when the positions have been projected. We re-fit on the first
     * flush after each fit request, which also covers the two cases a frame
     * count misses — the first `run:end` of a graph often precedes any position
     * write, and a superseded run ends `'stopped'`, which this arm ignores.
     *
     * One-shot isn't enough: the flush carrying the positions can land *before*
     * a listener attached at fit time, and the first flush after a fit isn't
     * necessarily the one with the moves. So each fit request opens a
     * {@link FLUSH_WATCH_MS} window and every flush inside it re-fits, throttled
     * — a live sim flushes per frame and must not drive `fitContent` at 60 Hz.
     */
    const FLUSH_WATCH_MS = 1_000;
    const FLUSH_THROTTLE_MS = 100;
    /**
     * How long the arming fit waits for a declared `activeLayout` to report a
     * run before framing anyway. Covers a layout that is named in the config but
     * never runs (no data, an id with no registered layout, a layout that throws)
     * — without it, such a canvas would sit unframed forever.
     */
    const LAYOUT_GRACE_MS = 1_200;
    let watchUntil = 0;
    let lastFlushFit = 0;
    /** One rAF in flight — see {@link requestFit}. */
    let fitQueued = false;
    /** True once the active layout has reported a tick or a settle. */
    let layoutHasPlaced = false;

    /**
     * Coalesce every fit request onto **one camera write per frame**.
     *
     * `fitContent` writes the transform synchronously and emits two events, so
     * the old shape — three independent signals (`data:flush`, `layout:run:tick`,
     * `layout:run:end`), each with its own leading-edge throttle, each scheduling
     * its own rAF — could put several *different* transforms on screen in quick
     * succession. That staircase is what reads as jitter while a graph settles.
     * Requests inside the same frame now collapse into the last one.
     */
    const requestFit = (): void => {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => {
        fitQueued = false;
        // `config.fitAnimation` eases the **first** fit only. Easing the
        // follow-fits too would turn a settling layout into a chase, each glide
        // retargeting before the last finished.
        const first = !this._firstFitDone;
        this._firstFitDone = true;
        if (first && this._fitAnimation) this._fitViewAnimated(this._fitAnimation);
        else this.fitView();
        // This is the frame the picture is worth showing: the camera has framed
        // real positions. Start the entrance from here rather than from the
        // first flush, which lands while the graph is still unplaced.
        if (first) this._playEntrance();
      });
    };
    // One lifetime listener, gated by `watchUntil` — cheaper than subscribing
    // and unsubscribing per fit, and it cannot miss a flush that lands between
    // the two. Throttled so a live sim (which flushes every frame) can't turn
    // this into a 60 Hz `fitContent`. Note it does **not** extend the window:
    // only a deliberate fit request does, or a flushing sim would keep the watch
    // open for the canvas's life.
    this.events.on('data:flush', () => {
      const now = performance.now();
      if (now > watchUntil || now - lastFlushFit < FLUSH_THROTTLE_MS) return;
      lastFlushFit = now;
      requestFit();
    });
    const fit = (): void => {
      watchUntil = performance.now() + FLUSH_WATCH_MS;
      requestFit();
    };
    const activeLayout = (): string | null | undefined =>
      this.store.view.getState().definition.activeLayout;

    /**
     * The arming fit, deferred by one frame — and **skipped** when a layout owns
     * placement and has not run yet.
     *
     * Fitting here used to be unconditional, on the reasoning that the run-driven
     * fits below supersede it. They do, but not before it has been *seen*: a
     * graph whose nodes have no authored `position` sits entirely at the store
     * origin until its layout writes, so this fit measures one node's box and
     * frames it — a ~9× zoom onto empty space, held until the solve lands. The
     * bounds are not stale (`doc:docs/autofit-bounds-rfc.md` fixed that; they are
     * read from the store); they are *honest about a graph that has not been
     * placed yet*, which is a different thing and can only be fixed by waiting.
     *
     * The wait is one frame, because `fitOnLoad` and `activeLayout` arrive in
     * separate `update()` patches from a React root — reading `activeLayout` at
     * arm time is exactly the bug the 2026-08 pass fixed. One frame later the
     * config has landed, so the question can be asked honestly.
     */
    requestAnimationFrame(() => {
      if (activeLayout() && !layoutHasPlaced) {
        this._autoFitGrace = setTimeout(() => {
          this._autoFitGrace = undefined;
          if (!layoutHasPlaced) fit();
        }, LAYOUT_GRACE_MS);
        return;
      }
      fit();
    });

    // **Always** subscribe, even when there is no `activeLayout` yet. Arming
    // happens on the `update()` that carries `fitOnLoad`, and that patch can
    // land before the one naming `activeLayout` — a React root applies config
    // after mount, so at arm time the definition routinely still reads `null`.
    // Returning early there (as this did) threw the subscriptions away for the
    // canvas's whole life: the layout then ran, emitted a perfectly good
    // `layout:run:end` / `settled`, and nobody was listening. All that survived
    // was the one-shot fit above, measured before the layout had written
    // anything — a box the size of a single node, i.e. the runaway zoom. The
    // listeners re-read `activeLayout()` per event, so late assignment is fine.
    const THROTTLE_MS = 100;
    let lastFit = 0;
    this.events.on('layout:run:tick', ({ id }) => {
      if (id !== activeLayout()) return;
      this._clearAutoFitGrace();
      layoutHasPlaced = true;
      const now = performance.now();
      if (now - lastFit < THROTTLE_MS) return;
      lastFit = now;
      fit();
    });
    this.events.on('layout:run:end', ({ id, reason }) => {
      if (id !== activeLayout() || reason !== 'settled') return;
      this._clearAutoFitGrace();
      layoutHasPlaced = true;
      fit();
    });
  }

  /**
   * Arm `config.entrance`: hold the world at alpha 0 and wait for the first
   * frame worth showing.
   *
   * Arming writes alpha **immediately**, before any trigger. That ordering is
   * the whole design: if the world were left opaque until the trigger fired,
   * the content would paint normally for several frames and then snap to
   * invisible to begin its fade — a pop, which is worse than the cut the
   * entrance exists to remove.
   *
   * The trigger is the first fit when {@link CanvasConfig.fitOnLoad} is armed
   * (the camera has framed real positions by then), otherwise the first
   * `data:flush`. Either way a grace timer releases the fade regardless, so a
   * canvas whose trigger never arrives cannot be left permanently invisible —
   * the same reasoning as the auto-fitter's `LAYOUT_GRACE_MS`, and for the same
   * reason: a feature that can hide a scene forever must have a floor.
   */
  private _armEntrance(cfg: NonNullable<CanvasConfig['entrance']>): void {
    if (this._entrance) return;
    /**
     * How long the entrance waits for its trigger before fading in anyway.
     * Deliberately longer than the auto-fitter's grace: the fit is usually this
     * entrance's trigger, so this must not pre-empt it.
     */
    const ENTRANCE_GRACE_MS = 2_000;
    this._entrance = {
      durationMs: Math.max(1, cfg.durationMs ?? 320),
      easing: cfg.easing,
      armed: true,
      played: false,
      tween: null,
      grace: setTimeout(() => {
        if (this._entrance) this._entrance.grace = undefined;
        this._playEntrance();
      }, ENTRANCE_GRACE_MS),
    };
    for (const surface of this._worldSurfaces) surface.setAlpha(0);

    // Arming *after* the canvas has already framed once — an imported snapshot,
    // or a config patch that lands late — has no trigger left to wait for: the
    // first fit is long gone and `data:flush` is gated behind it. Play on the
    // next frame instead, so the restored scene fades in rather than sitting
    // blank until the grace timer rescues it.
    if (this._firstFitDone) {
      requestAnimationFrame(() => this._playEntrance());
      return;
    }

    // No `fitOnLoad` to hang off: the first data to reach the renderer is the
    // scene. Registered unconditionally and guarded inside — `fitOnLoad` may be
    // armed by a *later* `update()` than the one carrying `entrance`.
    this.events.on('data:flush', () => {
      if (this._autoFitArmed) return;
      this._playEntrance();
    });
  }

  /**
   * Start the fade. Idempotent and one-shot: re-layouts, data changes and
   * re-fits never replay it (G-5) — an entrance that fires twice is an
   * animation tax, not a welcome.
   */
  private _playEntrance(): void {
    const e = this._entrance;
    if (!e || e.played) return;
    e.played = true;
    e.armed = false;
    if (e.grace !== undefined) {
      clearTimeout(e.grace);
      e.grace = undefined;
    }
    e.tween = new Tween({
      from: 0,
      to: 1,
      duration: e.durationMs,
      easing: resolveEasing(e.easing),
    });
  }

  /**
   * Advance the entrance fade by one frame. Called from {@link tickOnce}; a
   * no-op on every canvas that did not opt in, which is the default.
   */
  private _tickEntrance(dt: number): void {
    const e = this._entrance;
    if (!e?.tween) return;
    const running = e.tween.tick(dt);
    const alpha = running ? e.tween.value : 1;
    for (const surface of this._worldSurfaces) surface.setAlpha(alpha);
    if (running) return;
    // Retire: leave every surface at exactly 1 and stop writing alpha, so the
    // settled picture is identical to one that never had an entrance.
    e.tween = null;
    this._entrance = null;
  }

  /** Cancel the pending {@link _armAutoFit} grace timer, if any. */
  private _clearAutoFitGrace(): void {
    if (this._autoFitGrace === undefined) return;
    clearTimeout(this._autoFitGrace);
    this._autoFitGrace = undefined;
  }

  /**
   * Union of the world layers' content bounds (screen-fixed layers are excluded —
   * they don't pan/zoom). Returns `null` when nothing has real extent yet.
   *
   * World layers are detected by duck-typing on `getBounds` (a `WorldLayer`-only
   * method — screen layers don't have it) rather than `instanceof WorldLayer`,
   * which is unreliable when a bundler serves a domain package (e.g.
   * `@invana/graph`'s `GraphLayer`) a *separate copy* of the base class.
   */
  private _contentBounds(): Rect | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let any = false;
    for (const layer of this.layers.byZOrder()) {
      const getBounds = (layer as { getBounds?: () => Rect }).getBounds;
      if (typeof getBounds !== 'function') continue;
      const r = getBounds.call(layer);
      if (!r || (r.width <= 0 && r.height <= 0)) continue;
      any = true;
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    }
    return any ? { x: minX, y: minY, width: maxX - minX, height: maxY - minY } : null;
  }

  /**
   * Frame-performance recorder — instantaneous + windowed FPS and the per-phase
   * CPU breakdown for the last N frames. Read it for a HUD (`canvas.frames.stats()`)
   * or subscribe to the per-frame `render:loop:tick` event for streaming.
   */
  get frames(): FrameMeter {
    return this._frames;
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
      // Honour a runtime `enabled` toggle explicitly: route it through the
      // registry (fires `scene:behaviour:enable`/`disable` + gesture-conflict
      // bookkeeping), mirroring `_activate`. The base `Behaviour.setOptions`
      // seam applies `enabled` too, but several behaviours override `setOptions`
      // without calling `super`, so relying on that alone silently drops the
      // toggle — the engine applies it here so `update` is authoritative.
      const enabled = (options as { enabled?: boolean }).enabled;
      if (enabled !== undefined) this.behaviours.setEnabled(id, enabled);
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
      // Load behaviour is authored config like any other: it belongs in the
      // definition, or `canvas.get()` and export/import silently lose it.
      if (patch.fitOnLoad !== undefined) s.definition.canvas.fitOnLoad = patch.fitOnLoad;
      if (patch.fitAnimation !== undefined) s.definition.canvas.fitAnimation = patch.fitAnimation;
      if (patch.entrance !== undefined) s.definition.canvas.entrance = patch.entrance;
    }, 'canvas:update');

    // Fit-on-load is a config setting applied here (works whether config arrives at
    // `init` or via a later `update` — the React root does the latter). `true` arms
    // the auto-fitter (frames the graph on load and follows each active-layout run).
    // Read before arming the fitter: `_armAutoFit`'s first fit is the
    // entrance's trigger, and the eased-fit setting must be in place by then.
    if (patch.fitAnimation !== undefined) this._fitAnimation = patch.fitAnimation;
    if (patch.entrance !== undefined) this._armEntrance(patch.entrance);
    if (patch.fitOnLoad === true) this._armAutoFit();
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
      ...(d.canvas.fitOnLoad !== undefined ? { fitOnLoad: d.canvas.fitOnLoad } : {}),
      ...(d.canvas.fitAnimation !== undefined ? { fitAnimation: d.canvas.fitAnimation } : {}),
      ...(d.canvas.entrance !== undefined ? { entrance: d.canvas.entrance } : {}),
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
      // Reactive run-status (source of truth for any "is a layout running?" UI —
      // toolbars read `runtime.layout.running`), then the bus event.
      this.store.actions.layoutStatus.begin(layout.id, animate ?? false);
      this.events.emit('layout:run:start', {
        id: layout.id,
        layerId,
        nodeCount: nodeCount ?? 0,
        edgeCount: edgeCount ?? 0,
        animate: animate ?? false,
      });
    });
    const offEnd = layout.events.on('end', ({ reason }) => {
      this.store.actions.layoutStatus.end();
      this.events.emit('layout:run:end', {
        id: layout.id,
        layerId,
        reason: reason === 'completed' ? 'settled' : 'stopped',
      });
    });
    // Bridge per-tick progress too, so consumers can follow an animated settle
    // (e.g. fit-on-load re-frames the growing graph). High-frequency for a live
    // sim — subscribe sparingly and throttle.
    const offTick = layout.events.on('tick', () => {
      this.events.emit('layout:run:tick', { id: layout.id });
    });

    return layout.apply(target as never).finally(() => {
      offStart();
      offEnd();
      offTick();
    });
  }

  /**
   * Cancel the layout run that's currently in flight, if any. Reads the running
   * layout id from the reactive run-status (`runtime.layout.activeId`, written by
   * {@link runLayout}) and calls its optional `stop()` — which settles the run,
   * emits `end` (`reason: 'stopped'`), and clears `runtime.layout.running` back
   * through the same bridge. No-op when nothing is running or the layout has no
   * `stop()`. This is the engine-level counterpart a "Stop layout" control calls
   * to halt the active (e.g. load-time) layout, distinct from any layout a UI
   * applied out-of-band.
   */
  stopLayout(): void {
    const id = this.store.view.getState().runtime.layout.activeId;
    if (!id) return;
    const layout = this.layouts.get(id) as { stop?: () => void } | undefined;
    layout?.stop?.();
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

    this._interactions.dispose();
    this._clearAutoFitGrace();
    this._stopFrameLoop();
    this._clearAutoFitGrace();
    if (this._entrance?.grace !== undefined) {
      clearTimeout(this._entrance.grace);
      this._entrance.grace = undefined;
    }
    this._entrance = null;
    // Registries first: layers unmount and destroy their surfaces while the
    // backend is still alive.
    this.layers?.clear();
    this.behaviours?.clear();
    this.layouts?.clear();
    this.camera?.dispose();
    this.events.clearTaps();
    this.events.removeAllListeners();
    // The renderer owns the scene root, the `Application`, the drawing surface,
    // the resize observer and the shared texture-pool ref-count — all released
    // together, in the right order, by its own teardown.
    this._renderer?.destroy();
    this._renderer = undefined;
    this._isInitialised = false;
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  /**
   * Start the engine's frame loop — **the only `requestAnimationFrame` in the
   * system** (G3).
   *
   * Each frame advances engine state first (`tickOnce`: camera easing, data
   * flush, culling, layer updates) and *then* asks the backend to present
   * (`renderer.tick`). That order is the point: a renderer scheduling its own
   * frames would present state from the previous tick, and two clocks make
   * frame order — and any timing bug — impossible to reason about.
   *
   * No-op where `requestAnimationFrame` doesn't exist (node tests); those drive
   * `tickOnce` by hand, which is exactly what one clock buys.
   */
  private _startFrameLoop(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    let last = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const frame = (now: number): void => {
      this._rafHandle = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      this.tickOnce(dt);
      this._renderer?.tick(dt);
    };
    this._rafHandle = requestAnimationFrame(frame);
  }

  private _stopFrameLoop(): void {
    if (this._rafHandle !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafHandle);
    }
    this._rafHandle = null;
  }

  // No _resolveDefaultRenderer() — renderer-pixijs is a required dependency,
  // imported directly at module scope above.

  /**
   * Build the camera and the `CanvasContext` on top of the mounted renderer.
   * No pixi object is constructed here: the scene root came from
   * `renderer.mount`, the camera rides a renderer-supplied binding, and every
   * surface / overlay is a renderer factory call.
   */
  private _wireScene(screenWidth: number, screenHeight: number): void {
    const renderer = this._renderer!;
    this.camera = new Camera({
      binding: renderer.createCameraBinding(),
      screenWidth,
      screenHeight,
      bus: this.events,
      store: this.store,
    });
    // Surfaces need the camera (hit-floor scaling, label-rasterisation
    // priority), so it must be attached before any layer mounts.
    renderer.attachCamera(this.camera);

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
      camera: this.camera,
      gestures: this.gestures,
      layers: this.layers,
      behaviours: this.behaviours,
      ...(renderer.canvasElement ? { canvasElement: renderer.canvasElement } : {}),
      // The reactive-store factory behind `Layer.state` — injected here because
      // `@invana/canvas-core` is dependency-free and cannot construct one. A
      // collaborative canvas swaps this for a Yjs-backed factory.
      createStateStore: (initial) => createReactiveStore(initial),
      createSurface: (space, id, opts) => {
        const surface = renderer.createSurface(space, id, opts);
        if (space === 'world') {
          this._worldSurfaces.add(surface);
          // A layer mounted *during* the entrance must join it mid-fade, not
          // appear at full opacity over a half-faded scene.
          const e = this._entrance;
          if (e && !e.played) surface.setAlpha(e.tween ? e.tween.value : 0);
          const destroy = surface.destroy.bind(surface);
          surface.destroy = () => {
            this._worldSurfaces.delete(surface);
            destroy();
          };
        }
        return surface;
      },
      createOverlay: (label, space) => renderer.createOverlay(label, space),
      showMessage: (text, timeout) => this.showMessage(text, timeout),
      clearMessage: () => this.clearMessage(),
    };
  }

}
