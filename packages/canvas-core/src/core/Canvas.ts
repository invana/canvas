/**
 * Canvas
 * 
 * The main entry point for creating high-performance canvas visualizations.
 * A lightweight orchestrator that manages viewport (pan/zoom) and layers.
 * All rendering is done via plugins (e.g., GraphDataPlugin for graph visualization).
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container: document.getElementById('app'),
 *   width: 800,
 *   height: 600,
 * });
 * 
 * await canvas.init();
 * 
 * // Add graph visualization plugin
 * const graphPlugin = new GraphDataPlugin();
 * await canvas.registerPlugin(graphPlugin);
 * 
 * // Render graph data via plugin
 * graphPlugin.setData({
 *   nodes: [
 *     { id: 'n1', x: 100, y: 100, shape: 'circle' },
 *     { id: 'n2', x: 300, y: 200, shape: 'rect' },
 *   ],
 *   edges: [
 *     { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
 *   ],
 * });
 * ```
 */

import { Application, Container, Graphics, type Ticker } from 'pixi.js';
import { Viewport, type ViewportOptions } from '../viewport/Viewport';
import { Registry } from '../rendering/Registry';
import { LayerManager } from '../layers/LayerManager';
import type { CanvasPlugin, PluginRegistrationOptions, PluginConfig, BehaviorPreset } from '../plugins/types';
import { PluginRegistry } from '../plugins/registry';
import { EventEmitter } from '../utils/EventEmitter';
import type { CanvasEventMap } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Canvas configuration options
 */
export interface CanvasOptions {
  /** Container element to mount the canvas */
  container: HTMLElement;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  /** Background color */
  backgroundColor?: string;
  /** Pixel ratio for high-DPI displays */
  resolution?: number;
  /** Prefer WebGPU over WebGL2 */
  preferWebGPU?: boolean;
  /** Viewport options */
  viewport?: Partial<ViewportOptions>;
  /** Custom registry (or use defaults) */
  registry?: Registry;
  /** Enable antialiasing */
  antialias?: boolean;
  /** Behavior preset for common plugin combinations */
  behavior?: BehaviorPreset;
  /** Additional plugins to load (serializable) */
  plugins?: PluginConfig[];
}

/**
 * Canvas state snapshot
 */
export interface CanvasState {
  width: number;
  height: number;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// ============================================================================
// CANVAS
// ============================================================================

export class Canvas {
  private _container: HTMLElement;
  private _app: Application | null = null;
  private _viewport: Viewport | null = null;
  private _registry: Registry;
  private _initialized: boolean = false;

  // Layers
  private _layerManager: LayerManager | null = null;

  // Plugins with metadata (including user-defined keys)
  private _plugins: Map<string, { plugin: CanvasPlugin; userKey?: string }> = new Map();

  // Complete internal state for all options
  private _options: CanvasOptions;

  /**
   * Typed event bus. All interaction events from nodes, edges, and the
   * canvas background are emitted here. Use canvas.on() to subscribe.
   */
  readonly events: EventEmitter<CanvasEventMap> = new EventEmitter<CanvasEventMap>();

  /**
   * Subscribe to a canvas interaction event.
   * Returns a disposer function that removes the listener when called.
   */
  on<K extends keyof CanvasEventMap>(
    event: K,
    callback: (data: CanvasEventMap[K]) => void,
  ): () => void {
    return this.events.on(event, callback);
  }

  /**
   * Unsubscribe from a canvas interaction event.
   */
  off<K extends keyof CanvasEventMap>(
    event: K,
    callback: (data: CanvasEventMap[K]) => void,
  ): void {
    this.events.off(event, callback);
  }

  /**
   * Subscribe to a canvas interaction event (fires once then auto-unsubscribes).
   * Returns a disposer function.
   */
  once<K extends keyof CanvasEventMap>(
    event: K,
    callback: (data: CanvasEventMap[K]) => void,
  ): () => void {
    return this.events.once(event, callback);
  }

  constructor(options: CanvasOptions) {
    this._container = options.container;
    this._registry = options.registry ?? new Registry();

    // Get container dimensions, fallback to reasonable defaults if container not yet in DOM
    let containerWidth = 800;
    let containerHeight = 600;
    
    if (options.container) {
      const rect = options.container.getBoundingClientRect();
      if (rect.width > 0) containerWidth = rect.width;
      if (rect.height > 0) containerHeight = rect.height;
    }

    // Initialize complete internal state with all options
    this._options = {
      container: options.container,
      width: options.width ?? containerWidth,
      height: options.height ?? containerHeight,
      backgroundColor: options.backgroundColor ?? '#ffffff',
      resolution: options.resolution ?? window.devicePixelRatio ?? 1,
      preferWebGPU: options.preferWebGPU ?? true,
      viewport: options.viewport ?? {},
      registry: this._registry,
      antialias: options.antialias ?? true,
      behavior: options.behavior ?? 'default',
      plugins: options.plugins,
    };
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  /**
   * Initialize the canvas (async for WebGPU init)
   */
  async init(): Promise<void> {
    if (this._initialized) return;

    // Create PixiJS Application
    this._app = new Application();

    await this._app.init({
      width: this._options.width,
      height: this._options.height,
      backgroundColor: this._options.backgroundColor,
      resolution: this._options.resolution,
      autoDensity: true,
      antialias: this._options.antialias,
      preference: this._options.preferWebGPU ? 'webgpu' : 'webgl',
    });

    // Append canvas to container
    this._container.appendChild(this._app.canvas as HTMLCanvasElement);

    // Create viewport with pixi-viewport
    this._viewport = new Viewport({
      width: this._options.width ?? 800,
      height: this._options.height ?? 600,
      events: this._app.renderer.events,
      ...this._options.viewport,
    });
    this._app.stage.addChild(this._viewport);

    // Create layer manager (viewport itself is the content container)
    this._layerManager = new LayerManager(this._viewport);

    // Prevent browser context menu on canvas; also emit canvas:contextmenu into the event bus
    const canvasEl = this._app.canvas as HTMLCanvasElement;
    canvasEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this._viewport) {
        const rect = this._container.getBoundingClientRect();
        const screenX = (e as MouseEvent).clientX - rect.left;
        const screenY = (e as MouseEvent).clientY - rect.top;
        const world = this._viewport.toWorld(screenX, screenY);
        this.events.emit('canvas:contextmenu', {
          position: { screen: { x: screenX, y: screenY }, world: { x: world.x, y: world.y } },
          originalEvent: e,
        });
      }
    });

    // Wire canvas background pointer and click/dblclick events
    {
      let _lastBgTap = 0;
      const DBLCLICK_MS = 300;
      // Helper to emit all bg pointer events
      const emitBgPointer = (type: keyof CanvasEventMap, e: any) => {
        if (e.target !== this._viewport) return;
        const screen = { x: e.global.x, y: e.global.y };
        const w = this._viewport!.toWorld(screen.x, screen.y);
        const world = { x: w.x, y: w.y };
        this.events.emit(type, { position: { screen, world }, originalEvent: e });
      };
      this._viewport.on('pointerdown', (e) => emitBgPointer('canvas:pointerdown', e));
      this._viewport.on('pointermove', (e) => emitBgPointer('canvas:pointermove', e));
      this._viewport.on('pointerup', (e) => emitBgPointer('canvas:pointerup', e));
      this._viewport.on('pointerupoutside', (e) => emitBgPointer('canvas:pointerupoutside', e));
      this._viewport.on('globalpointermove', (e) => emitBgPointer('canvas:globalpointermove', e));
      this._viewport.on('pointertap', (e) => {
        if (e.target !== this._viewport) return;
        const screen = { x: e.global.x, y: e.global.y };
        const w = this._viewport!.toWorld(screen.x, screen.y);
        const world = { x: w.x, y: w.y };
        const now = Date.now();
        if (now - _lastBgTap < DBLCLICK_MS) {
          _lastBgTap = 0;
          this.events.emit('canvas:dblclicked', { position: { screen, world }, originalEvent: e });
        } else {
          _lastBgTap = now;
          this.events.emit('canvas:clicked', { position: { screen, world }, originalEvent: e });
        }
      });
    }

    // Bridge pixi-viewport native events → canvas event bus
    this._viewport.on('zoomed', () => {
      this.events.emit('viewport:zoomed', { scale: this._viewport!.scaled });
    });
    this._viewport.on('moved', () => {
      this.events.emit('viewport:panned', { x: this._viewport!.x, y: this._viewport!.y });
    });

    this._initialized = true;

    // Initialize plugins
    await this.initializePlugins();
  }

  /**
   * Initialize plugins from options
   * Handles both behavior presets and G6-style plugin configurations
   */
  private async initializePlugins(): Promise<void> {
    const pluginConfigs: PluginConfig[] = [];

    // 1. Add behavior preset plugins (if specified)
    const behavior = this._options.behavior;
    if (behavior && typeof behavior === 'string') {
      const presetIds = PluginRegistry.getBehaviorPreset(behavior);
      pluginConfigs.push(...presetIds);
    }

    // 2. Add plugins from options
    if (this._options.plugins) {
      pluginConfigs.push(...this._options.plugins);
    }

    // 3. Create and register all plugins
    for (const config of pluginConfigs) {
      try {
        const { plugin, key, options } = PluginRegistry.create(config);

        if (this._plugins.has(plugin.id)) {
          // Plugin already registered (e.g. behavior preset registered it first).
          // Apply options to the existing instance instead of throwing.
          if (options && Object.keys(options).length > 0) {
            const existing = this._plugins.get(plugin.id)!.plugin;
            if ('setOptions' in existing && typeof (existing as any).setOptions === 'function') {
              (existing as any).setOptions(options);
            }
          }
          continue;
        }

        await this.registerPlugin(plugin, { userKey: key });
        
        // Apply initial options if plugin has setOptions method
        if (options && Object.keys(options).length > 0) {
          if ('setOptions' in plugin && typeof (plugin as any).setOptions === 'function') {
            (plugin as any).setOptions(options);
          }
        }
      } catch (error) {
        console.error('Failed to initialize plugin:', config, error);
        // Continue with other plugins even if one fails
      }
    }
  }

  // =========================================================================
  // ACCESSORS
  // =========================================================================

  /** The PixiJS Application instance */
  get app(): Application | null {
    return this._app;
  }

  /** The Viewport for pan/zoom control */
  get viewport(): Viewport | null {
    return this._viewport;
  }

  /** The Registry for drawing primitives */
  get registry(): Registry {
    return this._registry;
  }

  /** Layer manager for plugin system */
  get layerManager(): LayerManager {
    if (!this._layerManager) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._layerManager;
  }

  /** Canvas width */
  get width(): number {
    return this._options.width ?? 800;
  }

  /** Canvas height */
  get height(): number {
    return this._options.height ?? 600;
  }

  /** Whether canvas is initialized */
  get initialized(): boolean {
    return this._initialized;
  }

  /** Current canvas state */
  get state(): CanvasState {
    return {
      width: this._options.width ?? 800,
      height: this._options.height ?? 600,
      viewport: this._viewport?.state ?? { x: 0, y: 0, zoom: 1 },
    };
  }

  // =========================================================================
  // OPTIONS
  // =========================================================================

  /**
   * Update canvas options dynamically
   */
  setOptions(options: Partial<CanvasOptions>): void {
    if (options.behavior !== undefined) {
      this.updateBehavior(options.behavior);
    }
    
    // Handle plugin updates with wrapper pattern
    if (options.plugins !== undefined) {
      for (const pluginConfig of options.plugins) {
        // Handle wrapper pattern: { plugin, key, options }
        if (typeof pluginConfig === 'object' && 'key' in pluginConfig && pluginConfig.key) {
          const { key, options: pluginOptions = {} } = pluginConfig as any;
          this.updatePlugin(key, pluginOptions);
        }
      }
    }
  }

  /**
   * Update behavior by dynamically changing plugins
   */
  private updateBehavior(behavior: BehaviorPreset): void {
    // Get the new behavior preset plugins
    const newPluginIds = behavior === false ? [] : PluginRegistry.getBehaviorPreset(behavior as string);
    
    // Get current behavior plugins
    const currentPluginIds = this._options.behavior === false 
      ? [] 
      : PluginRegistry.getBehaviorPreset(this._options.behavior as string);
    
    // Find plugins to remove (in current but not in new)
    const toRemove = currentPluginIds.filter(id => !newPluginIds.includes(id));
    
    // Find plugins to add (in new but not in current)
    const toAdd = newPluginIds.filter(id => !currentPluginIds.includes(id));
    
    // Remove old behavior plugins
    for (const pluginId of toRemove) {
      this.unregisterPlugin(pluginId);
    }
    
    // Add new behavior plugins
    for (const pluginId of toAdd) {
      try {
        const { plugin, key } = PluginRegistry.create(pluginId);
        // Plugin init is async but doesn't actually await anything, so we can fire-and-forget
        this.registerPlugin(plugin, { userKey: key });
      } catch (error) {
        console.error('Failed to register plugin:', pluginId, error);
      }
    }
    
    // Update stored behavior in options
    this._options.behavior = behavior;
  }

  // =========================================================================
  // VIEWPORT CONTROLS
  // =========================================================================

  /**
   * Resize the canvas
   */
  resize(width: number, height: number): void {
    if (!this._app || !this._viewport) return;

    this._options.width = width;
    this._options.height = height;
    this._app.renderer.resize(width, height);
    this._viewport.resize(width, height);
  }

  /**
   * Fit all content in view
   */
  fitContent(padding?: number): void {
    this._viewport?.fitContent(padding);
  }

  /**
   * Reset viewport to initial state
   */
  resetViewport(): void {
    this._viewport?.reset();
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  toWorld(screenX: number, screenY: number): { x: number; y: number } {
    return this._viewport?.toWorld(screenX, screenY) ?? { x: screenX, y: screenY };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  toScreen(worldX: number, worldY: number): { x: number; y: number } {
    return this._viewport?.toScreen(worldX, worldY) ?? { x: worldX, y: worldY };
  }

  // =========================================================================
  // PLUGIN SYSTEM
  // =========================================================================

  /**
   * Register a plugin
   */
  async registerPlugin(
    plugin: CanvasPlugin,
    options: PluginRegistrationOptions = {}
  ): Promise<void> {
    if (!this._initialized) {
      throw new Error('Canvas must be initialized before registering plugins. Call init() first.');
    }

    if (this._plugins.has(plugin.id)) {
      throw new Error(`Plugin '${plugin.id}' is already registered`);
    }

    // Get layer groups from plugin
    const layerGroups = plugin.getLayers();

    // Register plugin layer groups
    for (const groupConfig of layerGroups) {
      this._layerManager!.registerGroup(groupConfig);
    }

    // Store plugin with metadata
    this._plugins.set(plugin.id, { plugin, userKey: options.userKey });

    // Initialize plugin if autoInit is true (default)
    if (options.autoInit !== false) {
      await plugin.init(this);
    }
  }

  /**
   * Register multiple plugins
   */
  async registerPlugins(
    plugins: CanvasPlugin[],
    options: PluginRegistrationOptions = {}
  ): Promise<void> {
    for (const plugin of plugins) {
      await this.registerPlugin(plugin, options);
    }
  }

  /**
   * Get a registered plugin
   */
  getPlugin<T extends CanvasPlugin = CanvasPlugin>(id: string): T | undefined {
    return this._plugins.get(id)?.plugin as T | undefined;
  }

  /**
   * Get a plugin by its user-defined key (G6-style)
   */
  getPluginByKey<T extends CanvasPlugin = CanvasPlugin>(key: string): T | undefined {
    for (const metadata of this._plugins.values()) {
      if (metadata.userKey === key) {
        return metadata.plugin as T;
      }
    }
    return undefined;
  }

  /**
   * Update plugin options
   * @example
   * canvas.updatePlugin('my-background', {
   *   type: 'solid',
   *   color: '#e6f7ff',
   * });
   */
  updatePlugin(key: string, options: Record<string, any>): void {
    const plugin = this.getPluginByKey(key);
    
    if (!plugin) {
      console.warn(`Plugin with key '${key}' not found`);
      return;
    }
    
    // Try to call updateOptions or setOptions if plugin supports it
    if ('updateOptions' in plugin && typeof (plugin as any).updateOptions === 'function') {
      (plugin as any).updateOptions(options);
    } else if ('setOptions' in plugin && typeof (plugin as any).setOptions === 'function') {
      (plugin as any).setOptions(options);
    } else {
      // For plugins with specific setter methods
      // Try common update method names for each property
      for (const [optionKey, value] of Object.entries(options)) {
        const setterName = `set${optionKey.charAt(0).toUpperCase()}${optionKey.slice(1)}`;
        if (typeof (plugin as any)[setterName] === 'function') {
          (plugin as any)[setterName](value);
        }
      }
    }
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(id: string): boolean {
    return this._plugins.has(id);
  }

  /**
   * Unregister a plugin
   */
  unregisterPlugin(id: string): void {
    const metadata = this._plugins.get(id);
    if (metadata) {
      // Call destroy if available
      if (metadata.plugin.destroy) {
        metadata.plugin.destroy();
      }

      // Get layer groups and unregister them
      const layerGroups = metadata.plugin.getLayers();
      for (const groupConfig of layerGroups) {
        this._layerManager?.unregisterGroup(groupConfig.id);
      }

      this._plugins.delete(id);
    }
  }

  // =========================================================================
  // UTILITY
  // =========================================================================

  /**
   * Get the renderer type (webgpu or webgl)
   */
  getRendererType(): string {
    if (!this._app) return 'unknown';
    return this._app.renderer.type === 0x0001 ? 'webgl' : 'webgpu';
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string): void {
    if (!this._app) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._app.renderer.background.color = color;
  }

  /**
   * Set renderer background color and optional alpha.
   * Prefer this over accessing `canvas.app.renderer.background` directly.
   */
  setRendererBackground(color: string | number, alpha?: number): void {
    if (!this._app) return;
    this._app.renderer.background.color = color as string;
    if (alpha !== undefined) {
      this._app.renderer.background.alpha = alpha;
    }
  }

  /**
   * Get the underlying HTMLCanvasElement.
   * Prefer this over accessing `canvas.app.canvas` directly.
   */
  getCanvasElement(): HTMLCanvasElement {
    if (!this._app) throw new Error('Canvas not initialized. Call init() first.');
    return this._app.canvas as HTMLCanvasElement;
  }

  /**
   * Add a callback to the PixiJS render ticker.
   * Prefer this over accessing `canvas.app.ticker` directly.
   */
  addTicker(fn: (ticker: Ticker) => void, context?: unknown): void {
    this._app?.ticker.add(fn, context);
  }

  /**
   * Remove a previously added ticker callback.
   */
  removeTicker(fn: (ticker: Ticker) => void, context?: unknown): void {
    this._app?.ticker.remove(fn, context);
  }

  /**
   * Add a display object to the stage at a given insertion index (default 0).
   * Use index 0 to insert below the viewport, so the child does not pan/zoom.
   * Prefer this over accessing `canvas.app.stage` directly.
   */
  addBelowViewport(child: Container, index: number = 0): void {
    this._app?.stage.addChildAt(child, index);
  }

  /**
   * Remove a display object that was previously added via addBelowViewport().
   */
  removeFromStage(child: Container): void {
    this._app?.stage.removeChild(child);
  }

  /**
   * Create a screen-space (stage-level) drawing surface that does NOT pan/zoom with the viewport.
   * Internally creates a Container+Graphics, attaches to the stage, and returns:
   *   - `graphics` — the PixiJS Graphics surface to draw on
   *   - `remove()` — cleanup function; removes the Container from the stage
   *
   * Use `import type { Graphics } from 'pixi.js'` in the calling plugin to type the returned graphics
   * without introducing a runtime pixi.js dependency.
   */
  createStageSurface(
    label: string,
    zIndex = 0,
  ): { graphics: Graphics; remove: () => void } {
    if (!this._app) throw new Error('Canvas not initialized. Call init() first.');
    const container = new Container();
    container.label = label;
    container.zIndex = zIndex;
    container.eventMode = 'none';
    const graphics = new Graphics();
    graphics.label = `${label}-graphics`;
    graphics.eventMode = 'none';
    container.addChild(graphics);
    this._app.stage.addChildAt(container, 0);
    return {
      graphics,
      remove: () => {
        this._app?.stage.removeChild(container);
        container.destroy({ children: true });
      },
    };
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the canvas and clean up resources
   */
  destroy(): void {
    // Destroy plugins
    this._plugins.forEach(metadata => {
      if (metadata.plugin.destroy) {
        metadata.plugin.destroy();
      }
    });
    this._plugins.clear();

    // Destroy layer manager
    this._layerManager?.destroy();
    this._layerManager = null;

    // Destroy viewport and app
    this._viewport?.destroy();
    this._app?.destroy(true, { children: true });
    
    this._app = null;
    this._viewport = null;
    this._initialized = false;
  }
}
