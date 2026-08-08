/**
 * `PixiRenderer` — the PixiJS implementation of {@link IRenderer}, and the first
 * real one. Everything about standing a pixi backend up lives here: the
 * `Application` and its WebGPU→WebGL fallback, the shared texture-pool
 * ref-count, the render-time crash guard, the drawing surface and its resize
 * plumbing, the scene root (`stage` > `world` viewport), and the factories for
 * surfaces, overlays and the camera binding.
 *
 * `Canvas` above it is lifecycle and orchestration: it asks for devices and
 * never touches an `Application`, a `Viewport` or a `Container` of its own.
 *
 * This is the class P6 moves into `@invana/renderer-pixijs` — at which point
 * `@invana/canvas` keeps {@link IRenderer} and imports no pixi. Nothing here is
 * engine policy: picking (D5), the visible set (G4), layouts, behaviours and SVG
 * export all stay above this line.
 */

import { Application, Container, Rectangle, type EventSystem } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import type { CanvasEventBus, RendererBackend } from '@invana/canvas-store';

import type { Camera } from '../camera/Camera';
import type { ICameraBinding } from '../camera/ICameraBinding';
import { PixiViewportBinding } from '../camera/PixiViewportBinding';
import { acquireSharedTexturePool, releaseSharedTexturePool } from '../engine/sharedTexturePool';
import { resolveRenderPreference } from '../engine/rendererSupport';
import type { IOverlayDevice, OverlaySpace } from './IOverlayDevice';
import type { IRenderer, RendererCapabilities, RendererMountOptions } from './IRenderer';
import type { Rect } from '../specs/geometry';
import type { ISurface, SurfaceOptions, SurfaceSpace } from './ISurface';
import { PixiOverlayDevice } from './PixiOverlayDevice';
import { PixiSurface } from './PixiSurface';

/** Spec kinds this backend can draw — the built-in shape and connector registries. */
const PIXI_SPEC_KINDS = [
  'circle', 'ellipse', 'rect', 'tabbed-rect', 'polygon', 'regular-polygon',
  'star', 'arc', 'path', 'composite', 'arrow',
  'line', 'curve',
] as const;

export interface PixiRendererOptions {
  /**
   * The canvas-wide bus. A renderer publishes lifecycle and input onto it
   * (`canvas:renderer:fallback` when a WebGPU render crash forces a downgrade);
   * it never reads engine state from it.
   */
  events: CanvasEventBus;
  /**
   * Per-shape hit floor forwarded to each surface's primitives renderer. Engine
   * policy that surfaces need at construction; see `PrimitivesRendererOptions`.
   */
  hitFloorPx?: number;
}

export class PixiRenderer implements IRenderer {
  private readonly events: CanvasEventBus;
  private readonly hitFloorPx?: number;

  private app?: Application;
  private _stage?: Container;
  private _world?: Viewport;
  private _camera?: Camera;

  private _holdsSharedTexturePool = false;
  private _resizeObserver?: ResizeObserver;
  private _onRendererResize?: (w: number, h: number) => void;
  /**
   * Set once the WebGPU renderer has crashed at render time and we've halted the
   * loop + emitted `'canvas:renderer:fallback'`. Guards against repeating it.
   */
  private _fellBack = false;

  constructor(opts: PixiRendererOptions) {
    this.events = opts.events;
    this.hitFloorPx = opts.hitFloorPx;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  async mount(host: HTMLElement, opts: RendererMountOptions = {}): Promise<void> {
    const width = opts.width ?? host.clientWidth;
    const height = opts.height ?? host.clientHeight;
    const dpr =
      opts.resolution ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1);

    // Take ownership of pixi's shared TexturePool before the renderer spins up,
    // so destroying any one canvas can't clear the pool out from under other
    // live canvases (multi-canvas pages, story/route remounts). Balanced in
    // `destroy()`. Done before `app.init` so the WebGPU→WebGL retry below is
    // already covered. See `sharedTexturePool.ts`.
    acquireSharedTexturePool();
    this._holdsSharedTexturePool = true;

    // Resolve the backend before handing it to pixi. `resolveRenderPreference`
    // downgrades to `'webgl'` up front where WebGPU is unusable; a WebGPU
    // *render-time* crash (uncatchable at init) is caught by the guard below.
    const preference = resolveRenderPreference(
      opts.preference === 'auto' ? 'webgpu' : (opts.preference ?? 'webgpu'),
    );
    const initOpts = {
      width,
      height,
      resolution: dpr,
      autoDensity: true,
      antialias: opts.antialias ?? true,
      backgroundAlpha: opts.opaque ? 1 : 0,
      backgroundColor: opts.background ?? 0,
      powerPreference: opts.powerPreference ?? 'high-performance',
      hello: false,
      // With `autoResize`, point pixi's ResizePlugin at the host so its
      // `resize()` reads the element box and handles `autoDensity` / DPR. The
      // plugin only re-runs on the *window* resize event though — it never
      // observes the element — so element-only changes are picked up by the
      // `ResizeObserver` wired below instead.
      ...(opts.autoResize ? { resizeTo: host } : {}),
    };

    try {
      this.app = new Application();
      try {
        await this.app.init({ preference, ...initOpts });
      } catch (err) {
        // Defense in depth for what `resolveRenderPreference` can't predict: a
        // browser that advertises WebGPU but throws *during* init (a blocklisted
        // adapter / driver). Tear the half-built app down and retry once on
        // WebGL. WebKit's failure is at render time, not init, which is why the
        // preference must be resolved up front.
        if (preference !== 'webgpu') throw err;
        this.app.destroy(true);
        this.app = new Application();
        await this.app.init({ preference: 'webgl', ...initOpts });
      }
    } catch (err) {
      // Init failed outright, so `destroy()` will never run. Balance the
      // shared-pool acquire here or we leak the ref-count and leave the pool
      // detached.
      releaseSharedTexturePool();
      this._holdsSharedTexturePool = false;
      throw err;
    }

    this.app.canvas.style.display = 'block';
    host.appendChild(this.app.canvas);

    if (opts.suppressBrowserContextMenu ?? true) {
      this.app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    this.buildScene(this.app.stage, width, height, this.app.renderer.events);
    this.installRenderGuard();

    if (opts.autoResize) {
      this._onRendererResize = (w, h) => this._camera?.resize(w, h);
      this.app.renderer.on('resize', this._onRendererResize);
      // Pixi's ResizePlugin only listens for the window `resize` event, so it
      // misses element-only size changes (panel drags, flex reflow,
      // programmatic expand/collapse). Observe the host and queue a pixi resize
      // — which reads the current size and emits the `resize` event the handler
      // above hangs off. `queueResize` defers to the next frame and dedupes, so
      // rapid drag ticks coalesce.
      if (typeof ResizeObserver !== 'undefined') {
        this._resizeObserver = new ResizeObserver(() => this.app?.queueResize());
        this._resizeObserver.observe(host);
      }
    }
  }

  /**
   * Headless entry: adopt a caller-supplied stage instead of creating an
   * `Application`. **Adapter-specific, deliberately not on {@link IRenderer}** —
   * it exists for unit tests of the layer / behaviour / state pipeline that
   * don't need a GPU, and a second backend has no obligation to offer it.
   */
  mountStage(stage: Container, screenWidth: number, screenHeight: number): void {
    this.buildScene(stage, screenWidth, screenHeight);
  }

  destroy(): void {
    if (this._onRendererResize && this.app) {
      this.app.renderer.off('resize', this._onRendererResize);
    }
    this._onRendererResize = undefined;
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;

    this._world?.destroy({ children: true });
    this._world = undefined;
    this._stage = undefined;

    if (this.app) {
      // Pixi destroys the renderer + canvas + ticker.
      this.app.destroy(true, { children: true });
      this.app = undefined;
    }
    // Release the shared TexturePool *after* the renderer is gone — the last
    // live canvas clears the pool here (see `sharedTexturePool.ts`).
    if (this._holdsSharedTexturePool) {
      releaseSharedTexturePool();
      this._holdsSharedTexturePool = false;
    }
  }

  // ─── Devices ─────────────────────────────────────────────────────────────

  createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface {
    const parent = space === 'screen' ? this.requireStage() : this.requireWorld();
    return new PixiSurface({
      id,
      space,
      parent,
      camera: this.requireCamera(),
      canvasElement: this.canvasElement,
      // The layer's own policy wins over the renderer-wide default.
      ...((opts?.hitFloorPx ?? this.hitFloorPx) !== undefined
        ? { hitFloorPx: opts?.hitFloorPx ?? this.hitFloorPx }
        : {}),
    });
  }

  createOverlay(label: string, space: OverlaySpace = 'world'): IOverlayDevice {
    return new PixiOverlayDevice(
      space === 'screen' ? this.requireStage() : this.requireWorld(),
      label,
    );
  }

  createCameraBinding(): ICameraBinding {
    return new PixiViewportBinding(this.requireWorld());
  }

  /**
   * Hand back the engine's `Camera` once it has been built on this renderer's
   * binding.
   *
   * The ordering is unavoidable and worth stating: the binding must exist before
   * a `Camera` can wrap it, and a surface needs the `Camera` (its primitives
   * renderer scales the hit floor and prioritises label rasterisation by what is
   * in view). So the sequence is `createCameraBinding` → `new Camera` →
   * `attachCamera` → `createSurface`. {@link createSurface} throws rather than
   * silently drawing without one.
   */
  attachCamera(camera: Camera): void {
    this._camera = camera;
  }

  // ─── Per-frame ───────────────────────────────────────────────────────────

  /**
   * Advance backend animation.
   *
   * ⚠ **Not yet the only clock.** G3 wants the engine to own the sole rAF and
   * drive this; today pixi's `Application.ticker` still drives `Canvas.tick`,
   * which calls here. Inverting that changes frame scheduling for every story,
   * so it is its own step (`docs/renderer-split-design.md` §9, P6).
   */
  tick(_dtMs: number): void {
    /* pixi presents on its own ticker; nothing extra to advance yet */
  }

  /**
   * Drive the frame loop off pixi's `Application.ticker` — see the ⚠ on
   * `IRenderer.startLoop` for why the renderer still owns this. No-op on the
   * headless path, which has no ticker and no frames.
   */
  startLoop(onFrame: (dtMs: number) => void): () => void {
    const ticker = this.app?.ticker;
    if (!ticker) return () => {};
    const cb = (t: { deltaMS: number }): void => onFrame(t.deltaMS);
    ticker.add(cb);
    return () => ticker.remove(cb);
  }

  resize(width: number, height: number): void {
    this.app?.renderer.resize(width, height);
  }

  worldContentBounds(): Rect | null {
    const world = this._world;
    if (!world) return null;
    const b = world.getLocalBounds();
    if (!(b.width > 0) || !(b.height > 0)) return null;
    return { x: b.minX, y: b.minY, width: b.width, height: b.height };
  }

  /**
   * Raster capture (G1). Extracts onto a **fully transparent clear** so the
   * caller composites its own background — which is what keeps a
   * `'transparent'` request honest.
   *
   * `region` is world-local (the world container's own space, before the camera
   * transform), matching what `captureRect` computes.
   */
  extract(opts: { region: Rect; resolution: number }): HTMLCanvasElement {
    const renderer = this.app?.renderer;
    if (!renderer?.extract) {
      throw new Error(
        'PixiRenderer.extract: a GPU renderer is required (unavailable in headless mode).',
      );
    }
    const r = opts.region;
    return renderer.extract.canvas({
      target: this.requireWorld(),
      frame: new Rectangle(r.x, r.y, r.width, r.height),
      resolution: opts.resolution,
      clearColor: [0, 0, 0, 0],
    }) as HTMLCanvasElement;
  }

  // ─── Reporting ───────────────────────────────────────────────────────────

  get canvasElement(): HTMLCanvasElement | null {
    return this.app?.canvas ?? null;
  }

  /** The pixi `Application`, when one exists. `undefined` on the headless path. */
  get application(): Application | undefined {
    return this.app;
  }

  /** The scene root. Screen-space surfaces attach here, above `world`. */
  get stage(): Container {
    return this.requireStage();
  }

  /** The camera-transformed world root. World-space surfaces attach here. */
  get world(): Container {
    return this.requireWorld();
  }

  get backend(): RendererBackend {
    if (!this.app) return 'canvas';
    // Pixi v8 renderers expose a `name` string.
    const name = (this.app.renderer as { name?: string }).name;
    if (name === 'webgpu' || name === 'webgl' || name === 'canvas') return name;
    const ctor = this.app.renderer.constructor.name.toLowerCase();
    if (ctor.includes('webgpu')) return 'webgpu';
    if (ctor.includes('webgl')) return 'webgl';
    return 'canvas';
  }

  get capabilities(): RendererCapabilities {
    return {
      effects: 'shader',
      textMode: 'native',
      rasterExport: this.app !== undefined,
      depth: false,
      specKinds: PIXI_SPEC_KINDS,
    };
  }

  /** Device facts for the `canvas:renderer:ready` event. */
  deviceInfo(): Record<string, unknown> {
    if (!this.app) return { headless: true };
    return {
      backend: this.backend,
      resolution: this.app.renderer.resolution,
      width: this.app.renderer.width,
      height: this.app.renderer.height,
    };
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  /**
   * Build the scene root: a `Viewport` as `world` under the stage. World is
   * added first (bottom); screen-space surfaces attach to the stage afterwards
   * and therefore draw above it — pixi child order *is* draw order.
   */
  private buildScene(
    stage: Container,
    screenWidth: number,
    screenHeight: number,
    events?: EventSystem,
  ): void {
    // In headless tests no real `EventSystem` exists. Viewport stores `events`
    // but doesn't use `events.domElement` unless an input plugin is enabled,
    // which headless never does, so a minimal stub is enough.
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
      // The engine owns the tick loop; don't auto-register on the global pixi
      // Ticker. `Camera.tick` forwards `deltaMS` into the binding.
      noTicker: true,
    });
    viewport.label = 'world';
    this._world = viewport;

    // Name the root so the pixi devtools scene tree reads `stage` rather than an
    // anonymous `Container`. A caller-supplied stage may be named already.
    if (!stage.label) stage.label = 'stage';
    this._stage = stage;
    stage.addChild(viewport);
  }

  /**
   * Wrap the renderer's `render` in place so a WebGPU render-time crash
   * (uncatchable at init) routes to {@link handleRenderError} instead of
   * throwing uncaught out of pixi's ticker. Non-invasive: same render path,
   * same timing, only a guard added.
   */
  private installRenderGuard(): void {
    const renderer = this.app?.renderer;
    if (!renderer) return;
    const original = renderer.render.bind(renderer);
    renderer.render = ((...args: Parameters<typeof original>) => {
      if (this._fellBack) return undefined as ReturnType<typeof original>;
      try {
        return original(...args);
      } catch (err) {
        this.handleRenderError(err);
        return undefined as ReturnType<typeof original>;
      }
    }) as typeof renderer.render;
  }

  /**
   * Recover from a render-time crash. On WebGPU: halt the render loop and emit
   * `'canvas:renderer:fallback'` **once** so the host re-inits on WebGL (the
   * `@invana/canvas-react` `<Canvas>` does this automatically). Any other
   * backend has nowhere to fall back to, so the error is re-thrown.
   */
  private handleRenderError(err: unknown): void {
    if (this._fellBack || this.backend !== 'webgpu') throw err;
    this._fellBack = true;
    // Stop the ticker so pixi's render loop can't re-hit the crash while the
    // host swaps backend.
    this.app?.ticker.stop();
    console.warn(
      '[canvas] WebGPU renderer crashed at render time; ' +
        'falling back to WebGL. Original error:',
      err,
    );
    this.events.emit('canvas:renderer:fallback', {
      from: 'webgpu',
      to: 'webgl',
      reason: err instanceof Error ? err.message : String(err),
    });
  }

  private requireStage(): Container {
    if (!this._stage) throw new Error('PixiRenderer: not mounted (no stage)');
    return this._stage;
  }

  private requireWorld(): Viewport {
    if (!this._world) throw new Error('PixiRenderer: not mounted (no world)');
    return this._world;
  }

  private requireCamera(): Camera {
    if (!this._camera) {
      throw new Error(
        'PixiRenderer: attachCamera() must be called before creating a surface',
      );
    }
    return this._camera;
  }
}
