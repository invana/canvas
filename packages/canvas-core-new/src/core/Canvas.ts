import { Container } from 'pixi.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../camera/Camera.js';
import { LayerManagerImpl } from '../layers/LayerManager.js';
import { PluginSystem } from '../plugins/PluginSystem.js';
import { EventBus } from '../events/EventBus.js';
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

  readonly plugins: PluginSystem;
  readonly events: EventBus;

  constructor(options: CanvasOptions) {
    this._options = options;
    this.events = new EventBus();
    this.plugins = new PluginSystem();
  }

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

    // 4. Build plugin context and wire PluginSystem
    const ctx = {
      camera: this._camera as CameraAPI,
      layers: this._layerManager as LayerManager,
      events: this.events,
      canvasElement: this._renderer.getCanvasElement(),
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
    };
    this.plugins._setContext(ctx);

    // 5. Register plugins from options
    await this._registerOptionsPlugins();
  }

  private async _registerOptionsPlugins(): Promise<void> {
    const { plugins: pluginConfigs = [] } = this._options;
    for (const cfg of pluginConfigs) {
      if (typeof cfg === 'string') {
        // bare string: user must register class separately — skip for now
        continue;
      }
      // Inline plugin instance
      if (typeof (cfg as unknown as CanvasPlugin).register === 'function') {
        await this.plugins.register(cfg as unknown as CanvasPlugin);
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

  resize(width: number, height: number): void {
    this._renderer.resize(width, height);
  }

  addTicker(fn: () => void): void {
    this._renderer.addTicker(fn);
  }

  removeTicker(fn: () => void): void {
    this._renderer.removeTicker(fn);
  }

  // Convenience passthrough to camera
  toWorld(screenX: number, screenY: number) { return this._camera.toWorld(screenX, screenY); }
  toScreen(worldX: number, worldY: number) { return this._camera.toScreen(worldX, worldY); }
  fitContent(padding?: number) { return this._camera.fitContent(padding); }

  destroy(): void {
    this.plugins.destroyAll();
    this._layerManager.destroy();
    this._camera.destroy();
    this._renderer.destroy();
    this.events.removeAllListeners();
  }
}
