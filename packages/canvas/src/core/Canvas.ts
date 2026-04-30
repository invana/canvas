import { Container } from 'pixi.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../camera/Camera.js';
import { LayerManagerImpl } from '../layers/LayerManager.js';
import { PluginSystem } from '../plugins/PluginSystem.js';
import { EventBus } from '../events/EventBus.js';
import {
  CanvasPointerDownEvent,
  CanvasPointerMoveEvent,
  CanvasPointerUpEvent,
  CanvasClickedEvent,
  CanvasResizeEvent,
} from '../events/canvas-events.js';
import type { CameraAPI } from '../camera/CameraAPI.js';
import type { LayerManager } from '../layers/types.js';
import type { CanvasPlugin } from '../plugins/types.js';
import type { CanvasOptions } from '../types/canvas.js';

function parseColor(c: string | number | undefined): number {
  if (c === undefined) return 0x1a1a2e;
  if (typeof c === 'number') return c;
  return parseInt(c.replace('#', ''), 16);
}

/**
 * Canvas — lean public orchestrator (~150 lines).
 *
 * Internal subsystems:
 *   Renderer    — PixiJS Application wrapper (never exposed)
 *   Camera      — pan/zoom (exposed via CameraAPI interface)
 *   LayerManager — layer create/show/hide (exposed as canvas.layers)
 *   PluginSystem — plugin register/get/remove (exposed as canvas.plugins)
 *   EventBus    — typed event bus (exposed as canvas.events)
 */
export class Canvas {
  private _renderer!: Renderer;
  private _camera!: Camera;
  private _layerManager!: LayerManagerImpl;
  private _options: CanvasOptions;
  private _resizeObserver?: ResizeObserver;

  readonly plugins: PluginSystem;
  readonly events: EventBus;

  /** @internal Static registry mapping plugin names to constructors */
  private static _pluginRegistry = new Map<
    string,
    new (options?: Record<string, unknown>) => CanvasPlugin
  >();

  /**
   * Register a plugin class under a string name so it can be referenced
   * declaratively in {@link CanvasOptions.plugins}.
   *
   * @example
   * ```ts
   * Canvas.registerPlugin('background', BackgroundPlugin);
   * ```
   */
  static registerPlugin(
    name: string,
    ctor: new (options?: Record<string, unknown>) => CanvasPlugin,
  ): void {
    this._pluginRegistry.set(name, ctor);
  }

  constructor(options: CanvasOptions) {
    this._options = options;
    this.events = new EventBus();
    this.plugins = new PluginSystem();
  }

  /**
   * Initialise the canvas — creates the WebGPU/WebGL renderer, camera, layer manager,
   * and registers any plugins passed in `CanvasOptions.plugins`.
   *
   * Must be awaited before calling any other method.
   *
   * @example
   * ```ts
   * const canvas = new Canvas({ container, width: 800, height: 600 });
   * await canvas.init();
   * ```
   */
  async init(): Promise<void> {
    const {
      container,
      width = container.clientWidth || 800,
      height = container.clientHeight || 600,
      backgroundColor,
      antialias = true,
    } = this._options;

    // 1. Create PixiJS renderer (internal)
    this._renderer = await Renderer.create({
      container,
      width,
      height,
      backgroundColor: parseColor(backgroundColor),
      antialias,
    });

    // 2. Create camera
    this._camera = new Camera({
      screenWidth: width,
      screenHeight: height,
      worldWidth: width * 4,
      worldHeight: height * 4,
      events: this.events,
      rendererEvents: this._renderer.getEvents(),
    });
    this._renderer.mountCamera(this._camera);

    // 3. Create layer manager (layers live inside the camera viewport)
    this._layerManager = new LayerManagerImpl(this.events);
    this._camera._viewport.addChild(this._layerManager._root);

    // 3b. Bridge viewport pointer events → canvas:* on the EventBus
    this._wirePointerEvents();

    // 4. Build plugin context and wire PluginSystem
    const ctx = {
      camera: this._camera as CameraAPI,
      layers: this._layerManager as LayerManager,
      events: this.events,
      canvasElement: this._renderer.getCanvasElement(),
      _ticker: this._renderer.getTicker(),
      createLayer: (opts: { id: string; zIndex: number; label?: string }) =>
        this._layerManager.createLayer(opts),
      createScreenLayer: (opts: { id: string; zIndex: number }) => {
        const existing = this._renderer.screenStage.children.find(
          (ch) => (ch as Container & { _pluginId?: string })._pluginId === opts.id,
        ) as Container | undefined;
        if (existing) return existing;
        const layer = new Container();
        (layer as Container & { _pluginId?: string })._pluginId = opts.id;
        layer.zIndex = opts.zIndex;
        this._renderer.screenStage.addChild(layer);
        this._renderer.screenStage.sortChildren();
        return layer;
      },
      getPlugin: <T extends import('../plugins/types.js').CanvasPlugin>(id: string): T | undefined =>
        this.plugins.get<T>(id),
    };
    this.plugins._setContext(ctx);

    // 5. Register plugins from options
    await this._registerOptionsPlugins();

    // 6. Auto-resize: keep Camera in sync when the container changes size
    if (this._options.autoResize !== false) {
      this._resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      });
      this._resizeObserver.observe(container);
    }
  }

  private _wirePointerEvents(): void {
    const vp = this._camera._viewport;
    const events = this.events;

    // 'clicked' fires only when no drag occurred — ideal for click vs pan distinction
    vp.on('clicked', (data) => {
      const native = (data.event as unknown as { nativeEvent?: PointerEvent }).nativeEvent
        ?? data.event as unknown as PointerEvent;
      events.emit('canvas:clicked', new CanvasClickedEvent({
        worldX: data.world.x, worldY: data.world.y,
        screenX: data.screen.x, screenY: data.screen.y,
        nativeEvent: native,
      }));
    });

    vp.on('pointermove', (e) => {
      const world = vp.toWorld(e.global.x, e.global.y);
      const native = (e as unknown as { nativeEvent?: PointerEvent }).nativeEvent
        ?? e as unknown as PointerEvent;
      events.emit('canvas:pointermove', new CanvasPointerMoveEvent({
        worldX: world.x, worldY: world.y,
        screenX: e.global.x, screenY: e.global.y,
        nativeEvent: native,
      }));
    });

    vp.on('pointerdown', (e) => {
      const world = vp.toWorld(e.global.x, e.global.y);
      const native = (e as unknown as { nativeEvent?: PointerEvent }).nativeEvent
        ?? e as unknown as PointerEvent;
      events.emit('canvas:pointerdown', new CanvasPointerDownEvent({
        worldX: world.x, worldY: world.y,
        screenX: e.global.x, screenY: e.global.y,
        nativeEvent: native,
      }));
    });

    vp.on('pointerup', (e) => {
      const world = vp.toWorld(e.global.x, e.global.y);
      const native = (e as unknown as { nativeEvent?: PointerEvent }).nativeEvent
        ?? e as unknown as PointerEvent;
      events.emit('canvas:pointerup', new CanvasPointerUpEvent({
        worldX: world.x, worldY: world.y,
        screenX: e.global.x, screenY: e.global.y,
        nativeEvent: native,
      }));
    });
  }

  private async _registerOptionsPlugins(): Promise<void> {
    const { plugins: pluginConfigs = [] } = this._options;
    for (const cfg of pluginConfigs) {
      // 1. Pre-instantiated plugin object (backward compat)
      if (typeof cfg === 'object' && cfg !== null && typeof (cfg as unknown as CanvasPlugin).register === 'function') {
        await this.plugins.register(cfg as unknown as CanvasPlugin);
        continue;
      }

      // 2. Bare string name
      if (typeof cfg === 'string') {
        const Ctor = Canvas._pluginRegistry.get(cfg);
        if (!Ctor) {
          console.warn(`[Canvas] Plugin "${cfg}" not found in registry. Did you forget to import the plugin package?`);
          continue;
        }
        const plugin = new Ctor();
        await this.plugins.register(plugin);
        continue;
      }

      // 3. Object config: { plugin: string; key?: string; options?: Record<string, unknown> }
      if (typeof cfg === 'object' && cfg !== null && 'plugin' in cfg && typeof cfg.plugin === 'string') {
        const Ctor = Canvas._pluginRegistry.get(cfg.plugin);
        if (!Ctor) {
          console.warn(`[Canvas] Plugin "${cfg.plugin}" not found in registry. Did you forget to import the plugin package?`);
          continue;
        }
        const options = cfg.options ? { ...cfg.options } : {};
        if (cfg.key !== undefined) {
          (options as Record<string, unknown>).key = cfg.key;
        }
        const plugin = new Ctor(options);
        await this.plugins.register(plugin);
        continue;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public accessors
  // ---------------------------------------------------------------------------

  /** Camera API — typed interface, never exposes pixi-viewport directly */
  get camera(): CameraAPI {
    return this._camera;
  }

  /** Layer manager */
  get layers(): LayerManager {
    return this._layerManager;
  }

  /** The underlying HTMLCanvasElement */
  getCanvasElement(): HTMLCanvasElement {
    return this._renderer.getCanvasElement();
  }

  /** 'webgpu' or 'webgl' depending on what the browser supports */
  getRendererType(): 'webgpu' | 'webgl' {
    return this._renderer.getRendererType();
  }

  /**
   * Resize the canvas to new dimensions.
   * Updates both the renderer and the camera viewport.
   * Called automatically when `autoResize` is enabled (default).
   * @param width - New width in CSS pixels
   * @param height - New height in CSS pixels
   */
  resize(width: number, height: number): void {
    this._renderer.resize(width, height);
    this._camera.resize(width, height);
    this.events.emit('canvas:resize', new CanvasResizeEvent({ width, height }));
  }

  /**
   * Add a function to the render loop. Called every frame.
   * Use this for animations that need to update per-frame state.
   * @param fn - Callback invoked once per frame
   */
  addTicker(fn: () => void): void {
    this._renderer.addTicker(fn);
  }

  /**
   * Remove a previously registered ticker function.
   * @param fn - The same function reference passed to `addTicker`
   */
  removeTicker(fn: () => void): void {
    this._renderer.removeTicker(fn);
  }

  /**
   * Convert screen-space coordinates to world-space coordinates.
   * Useful for mapping mouse/pointer events to canvas positions.
   * @param screenX - X position relative to the canvas element
   * @param screenY - Y position relative to the canvas element
   * @returns World-space `{ x, y }` point
   */
  toWorld(screenX: number, screenY: number) { return this._camera.toWorld(screenX, screenY); }

  /**
   * Convert world-space coordinates to screen-space coordinates.
   * Useful for positioning DOM overlays over canvas elements.
   * @param worldX - X position in world space
   * @param worldY - Y position in world space
   * @returns Screen-space `{ x, y }` point
   */
  toScreen(worldX: number, worldY: number) { return this._camera.toScreen(worldX, worldY); }

  /**
   * Destroy the canvas and all registered plugins.
   * Releases all PixiJS resources, event listeners, and plugin state.
   * After calling this, the instance should not be reused.
   */
  destroy(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    this.plugins.destroyAll();
    this._layerManager.destroy();
    this._camera.destroy();
    this._renderer.destroy();
    this.events.removeAllListeners();
  }
}
