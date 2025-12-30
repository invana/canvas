/**
 * Canvas
 * 
 * The main entry point for creating high-performance canvas visualizations.
 * Orchestrates the PixiJS Application, Viewport, Registry, and Renderer.
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
 * // Add graphics via renderer
 * canvas.renderer.addNode({ id: 'n1', x: 100, y: 100, shape: 'circle' });
 * canvas.renderer.addNode({ id: 'n2', x: 300, y: 200, shape: 'rect' });
 * canvas.renderer.addEdge({ id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' });
 * 
 * // Or render from data
 * canvas.render({
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

import { Application, Container } from 'pixi.js';
import { Viewport, type ViewportOptions } from '../viewport/Viewport';
import { Registry } from '../rendering/Registry';
import { Renderer, type CanvasNode as RendererNodeData, type CanvasEdge as RendererEdgeData } from '../rendering/Renderer';
import { type FunctionBasedNodeStyle, type FunctionBasedEdgeStyle } from '../style/FunctionBasedStyle';
import { DEFAULT_NODE_STYLE } from '../defaults/nodes';
import { SceneGraph } from '../scene/SceneGraph';
import { QueryEngine, type QueryFilter, type QueryResult } from '../scene/QueryEngine';
import { Relationships, type RelationshipInfo, type PathResult } from '../scene/Relationships';
import { LayerManager } from '../layers/LayerManager';
import type { CanvasPlugin, PluginRegistrationOptions, PluginConfig, BehaviorPreset } from '../plugins/types';
import { PluginRegistry } from '../plugins/registry';
import type { Bounds } from '../scene/SpatialIndex';
// LEGACY: These old types were removed. SceneGraph uses different EdgeData shape than ElementEdgeData
// For now using 'any' to unblock - needs proper type refactoring
// import type { NodeData as SceneNodeData, EdgeData as SceneEdgeData } from '../types';
type SceneNodeData = any;
type SceneEdgeData = any;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Data structure for Canvas
 */
export interface CanvasData {
  /** Array of node configurations */
  nodes: RendererNodeData[];
  /** Array of edge configurations */
  edges: RendererEdgeData[];
}

/**
 * Default styles for nodes and edges (supports function-based properties)
 */
export interface CanvasStyles {
  /** Default node style (can include function-based properties) */
  node?: Partial<FunctionBasedNodeStyle>;
  /** Default edge style (can include function-based properties) */
  edge?: Partial<FunctionBasedEdgeStyle>;
}

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
  /** Data to render (nodes and edges) */
  data?: CanvasData;
  /** Default styles for nodes and edges */
  styles?: CanvasStyles;
  /** Fit content to view after rendering */
  fitOnRender?: boolean;
  /** Padding for fit content */
  fitPadding?: number;
  /** Offset from node boundary for edges */
  edgeBoundaryOffset?: number;
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
  nodeCount: number;
  edgeCount: number;
}

// ============================================================================
// CANVAS
// ============================================================================

export class Canvas {
  private _container: HTMLElement;
  private _app: Application | null = null;
  private _viewport: Viewport | null = null;
  private _registry: Registry;
  private _renderer: Renderer | null = null;
  private _scene: SceneGraph;
  private _initialized: boolean = false;

  // Layers
  private _layerManager: LayerManager | null = null;
  private _edgeLayer: Container | null = null;
  private _nodeLayer: Container | null = null;

  // Plugins
  private _plugins: Map<string, CanvasPlugin> = new Map();

  // Configuration
  private _styles: CanvasStyles = {};
  private _options: Required<Omit<CanvasOptions, 'data' | 'styles' | 'plugins' | 'behavior'>>;

  constructor(options: CanvasOptions) {
    this._container = options.container;
    this._registry = options.registry ?? new Registry();
    this._styles = options.styles ?? {};
    this._scene = new SceneGraph();

    // Store plugin configuration for later initialization
    this._pluginConfigs = {
      behavior: options.behavior,
      plugins: options.plugins,
    };

    // Get container dimensions, fallback to reasonable defaults if container not yet in DOM
    let containerWidth = 800;
    let containerHeight = 600;
    
    if (options.container) {
      const rect = options.container.getBoundingClientRect();
      if (rect.width > 0) containerWidth = rect.width;
      if (rect.height > 0) containerHeight = rect.height;
    }

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
      fitOnRender: options.fitOnRender ?? true,
      fitPadding: options.fitPadding ?? 50,
      edgeBoundaryOffset: options.edgeBoundaryOffset ?? 2,
    };

    // If data provided, store for rendering after init
    if (options.data) {
      this._pendingData = options.data;
    }
  }

  private _pendingData: CanvasData | null = null;
  private _pluginConfigs: {
    behavior?: BehaviorPreset;
    plugins?: PluginConfig[];
  } = {};

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
      width: this._options.width,
      height: this._options.height,
      events: this._app.renderer.events,
      ...this._options.viewport,
    });
    this._app.stage.addChild(this._viewport);

    // Create layer manager
    this._layerManager = new LayerManager(this._viewport.content);

    // Get core layers (for backward compatibility, we use shapes layer)
    const edgeGroup = this._layerManager.getGroup('core-edges')!;
    const nodeGroup = this._layerManager.getGroup('core-nodes')!;

    this._edgeLayer = edgeGroup.getLayer('shapes')!.container;
    this._nodeLayer = nodeGroup.getLayer('shapes')!.container;

    // Create renderer with function-based styling support
    this._renderer = new Renderer({
      registry: this._registry,
      nodeLayer: this._nodeLayer,
      edgeLayer: this._edgeLayer,
      defaultNodeStyle: DEFAULT_NODE_STYLE,
      userNodeStyle: this._styles.node,
      userEdgeStyle: this._styles.edge,
      edgeBoundaryOffset: this._options.edgeBoundaryOffset,
    });

    // Prevent browser context menu on canvas
    const canvasEl = this._app.canvas as HTMLCanvasElement;
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    this._initialized = true;

    // Render pending data if provided in constructor
    if (this._pendingData) {
      this.render(this._pendingData);
      this._pendingData = null;
    }

    // Initialize plugins AFTER initial data render so they can setup existing nodes
    await this.initializePlugins();
  }

  /**
   * Initialize plugins from options
   * Pattern 4: Behavior preset + custom plugins
   */
  private async initializePlugins(): Promise<void> {
    const pluginConfigs: PluginConfig[] = [];

    // 1. Add behavior preset plugins (if specified)
    const behavior = this._pluginConfigs.behavior;
    if (behavior && typeof behavior === 'string') {
      const presetIds = PluginRegistry.getBehaviorPreset(behavior);
      pluginConfigs.push(...presetIds);
    }

    // 2. Add custom plugins (override or additional)
    if (this._pluginConfigs.plugins) {
      pluginConfigs.push(...this._pluginConfigs.plugins);
    }

    // 3. Create and register all plugins
    for (const config of pluginConfigs) {
      try {
        const plugin = PluginRegistry.create(config);
        await this.registerPlugin(plugin);
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

  /** The Renderer for graphics management */
  get renderer(): Renderer {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._renderer;
  }

  /** The SceneGraph for data management and queries */
  get scene(): SceneGraph {
    return this._scene;
  }

  /** Edge layer container */
  get edgeLayer(): Container | null {
    return this._edgeLayer;
  }

  /** Node layer container */
  get nodeLayer(): Container | null {
    return this._nodeLayer;
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
    return this._options.width;
  }

  /** Canvas height */
  get height(): number {
    return this._options.height;
  }

  /** Whether canvas is initialized */
  get initialized(): boolean {
    return this._initialized;
  }

  /** Current canvas state */
  get state(): CanvasState {
    return {
      width: this._options.width,
      height: this._options.height,
      viewport: this._viewport?.state ?? { x: 0, y: 0, zoom: 1 },
      nodeCount: this._renderer?.nodeCount ?? 0,
      edgeCount: this._renderer?.edgeCount ?? 0,
    };
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  /**
   * Render data (nodes and edges)
   * Clears existing content and renders from data
   * If no data is provided, uses data from constructor (if any)
   */
  render(data?: CanvasData): void {
    // Use provided data or pending data
    const dataToRender = data || this._pendingData;
    
    if (!dataToRender) {
      // No data to render (this is ok if data was already rendered during init)
      return;
    }

    if (!this._initialized || !this._renderer) {
      // Store for rendering after init
      this._pendingData = dataToRender;
      return;
    }

    // Clear existing content
    this._renderer.clear();
    this._scene.clear();

    // Add all nodes first
    this._renderer.addNodes(dataToRender.nodes || []);
    
    // Register nodes in scene graph
    (dataToRender.nodes || []).forEach(node => {
      this._scene.addNode({
        id: node.id as string,
        x: node.x,
        y: node.y,
      });
    });

    // Add all edges (nodes must exist for ID resolution)
    this._renderer.addEdges(dataToRender.edges || []);
    
    // Register edges in scene graph
    (dataToRender.edges || []).forEach(edge => {
      // Only add edges with string IDs (not points)
      if (typeof edge.source === 'string' && typeof edge.target === 'string') {
        this._scene.addEdge({
          id: edge.id as string,
          source: edge.source,
          target: edge.target,
        });
      }
    });

    // Fit content if enabled
    if (this._options.fitOnRender) {
      setTimeout(() => this.fitContent(this._options.fitPadding), 0);
    }
  }

  /**
   * Set default styles
   */
  setStyles(styles: CanvasStyles): void {
    this._styles = styles;
    // Note: styles only apply to new elements, existing elements are not updated
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
   * Clear all content
   */
  clear(): void {
    this._renderer?.clear();
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

    // Register plugin layer groups
    for (const groupConfig of plugin.layerGroups) {
      this._layerManager!.registerGroup(groupConfig);
    }

    // Store plugin
    this._plugins.set(plugin.id, plugin);

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
    return this._plugins.get(id) as T | undefined;
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
    const plugin = this._plugins.get(id);
    if (plugin) {
      // Call destroy if available
      if (plugin.destroy) {
        plugin.destroy();
      }

      // Unregister layer groups
      for (const groupConfig of plugin.layerGroups) {
        this._layerManager?.unregisterGroup(groupConfig.id);
      }

      this._plugins.delete(id);
    }
  }

  // =========================================================================
  // CONVENIENCE METHODS - Delegate to Renderer
  // =========================================================================

  /**
   * Add a node
   */
  addNode(input: RendererNodeData): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.addNode(input);
  }

  /**
   * Update a node
   */
  updateNode(id: string, updates: Partial<RendererNodeData>): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.updateNode(id, updates);
  }

  /**
   * Remove a node
   */
  removeNode(id: string): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.removeNode(id);
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): any {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._renderer.getNode(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): any[] {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._renderer.getNodes();
  }

  /**
   * Add an edge
   */
  addEdge(input: RendererEdgeData): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.addEdge(input);
  }

  /**
   * Update an edge
   */
  updateEdge(id: string, updates: Partial<RendererEdgeData>): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.updateEdge(id, updates);
  }

  /**
   * Remove an edge
   */
  removeEdge(id: string): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.removeEdge(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): any {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._renderer.getEdge(id);
  }

  /**
   * Get all edges
   */
  getEdges(): any[] {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    return this._renderer.getEdges();
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



  // =========================================================================
  // SCENE GRAPH QUERIES
  // =========================================================================

  /**
   * Query nodes with filters
   */
  queryNodes(filter: QueryFilter): QueryResult<SceneNodeData> {
    return QueryEngine.queryNodes(this._scene.getNodeMap(), filter);
  }

  /**
   * Query edges with filters
   */
  queryEdges(filter: QueryFilter): QueryResult<SceneEdgeData> {
    return QueryEngine.queryEdges(this._scene.getEdgeMap(), filter);
  }

  /**
   * Query nodes within rectangular bounds
   */
  queryNodesByBounds(bounds: Bounds): any[] {
    return this._scene.queryNodesByBounds(bounds);
  }

  /**
   * Query nodes within radius of a point
   */
  queryNodesByRadius(center: { x: number; y: number }, radius: number): any[] {
    return this._scene.queryNodesByRadius(center, radius);
  }

  /**
   * Find nearest node to a point
   */
  findNearestNode(point: { x: number; y: number }, maxDistance?: number): any {
    return this._scene.findNearestNode(point, maxDistance);
  }

  /**
   * Get relationship information for a node
   */
  getNodeRelationships(nodeId: string): RelationshipInfo {
    return Relationships.getNodeRelationships(
      nodeId,
      this._scene.getEdgeMap(),
      this._scene.getNodeEdgesMap()
    );
  }

  /**
   * Get neighbors of a node
   */
  getNeighbors(
    nodeId: string,
    options?: { direction?: 'incoming' | 'outgoing' | 'both' }
  ): string[] {
    return Relationships.getNeighbors(
      nodeId,
      this._scene.getEdgeMap(),
      this._scene.getNodeEdgesMap(),
      options
    );
  }

  /**
   * Find path between two nodes
   */
  findPath(
    startId: string,
    endId: string,
    options?: { maxDepth?: number; direction?: 'incoming' | 'outgoing' | 'both' }
  ): PathResult {
    return Relationships.findPath(
      startId,
      endId,
      this._scene.getEdgeMap(),
      this._scene.getNodeEdgesMap(),
      options
    );
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the canvas and clean up resources
   */
  destroy(): void {
    // Destroy plugins
    this._plugins.forEach(plugin => {
      if (plugin.destroy) {
        plugin.destroy();
      }
    });
    this._plugins.clear();

    // Destroy layer manager
    this._layerManager?.destroy();
    this._layerManager = null;

    // Destroy renderer and scene
    this._renderer?.destroy();
    this._renderer = null;
    this._scene.destroy();

    // Destroy viewport and app
    this._viewport?.destroy();
    this._app?.destroy(true, { children: true });
    
    this._app = null;
    this._viewport = null;
    this._edgeLayer = null;
    this._nodeLayer = null;
    this._initialized = false;
  }
}
