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
import { Renderer, type NodeInput, type EdgeInput } from '../rendering/Renderer';
import type { NodeStyle } from '../elements/nodes';
import type { EdgeStyle } from '../elements/edges';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Node configuration in CanvasData
 */
export interface CanvasNodeData extends NodeInput {}

/**
 * Edge configuration in CanvasData
 */
export interface CanvasEdgeData extends EdgeInput {}

/**
 * Data structure for Canvas
 */
export interface CanvasData {
  /** Array of node configurations */
  nodes: CanvasNodeData[];
  /** Array of edge configurations */
  edges: CanvasEdgeData[];
}

/**
 * Default styles for nodes and edges
 */
export interface CanvasStyles {
  /** Default node style */
  node?: Partial<NodeStyle>;
  /** Default edge style */
  edge?: Partial<EdgeStyle>;
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
  private _initialized: boolean = false;

  // Layers
  private _backgroundLayer: Container | null = null;
  private _edgeLayer: Container | null = null;
  private _nodeLayer: Container | null = null;

  // Configuration
  private _styles: CanvasStyles = {};
  private _options: Required<Omit<CanvasOptions, 'data' | 'styles'>>;

  constructor(options: CanvasOptions) {
    this._container = options.container;
    this._registry = options.registry ?? new Registry();
    this._styles = options.styles ?? {};

    this._options = {
      container: options.container,
      width: options.width ?? options.container.clientWidth ?? 800,
      height: options.height ?? options.container.clientHeight ?? 600,
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

    // Create viewport
    this._viewport = new Viewport({
      width: this._options.width,
      height: this._options.height,
      ...this._options.viewport,
    });
    this._app.stage.addChild(this._viewport);

    // Create layers
    this._backgroundLayer = new Container();
    this._backgroundLayer.label = 'background';
    this._viewport.content.addChild(this._backgroundLayer);

    this._edgeLayer = new Container();
    this._edgeLayer.label = 'edges';
    this._viewport.content.addChild(this._edgeLayer);

    this._nodeLayer = new Container();
    this._nodeLayer.label = 'nodes';
    this._viewport.content.addChild(this._nodeLayer);

    // Create renderer
    this._renderer = new Renderer({
      registry: this._registry,
      nodeLayer: this._nodeLayer,
      edgeLayer: this._edgeLayer,
      defaultNodeStyle: {
        fill: '#4a90d9',
        stroke: '#333',
        strokeWidth: 2,
        labelPosition: 'center',
        labelStyle: { fill: '#ffffff', fontSize: 12 },
        ...this._styles.node,
      },
      defaultEdgeStyle: {
        stroke: '#666',
        strokeWidth: 2,
        ...this._styles.edge,
      },
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

  /** Background layer container */
  get backgroundLayer(): Container | null {
    return this._backgroundLayer;
  }

  /** Edge layer container */
  get edgeLayer(): Container | null {
    return this._edgeLayer;
  }

  /** Node layer container */
  get nodeLayer(): Container | null {
    return this._nodeLayer;
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
    this._backgroundLayer?.removeChildren();

    // Add all nodes first
    this._renderer.addNodes(dataToRender.nodes || []);

    // Add all edges (nodes must exist for ID resolution)
    this._renderer.addEdges(dataToRender.edges || []);

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
   * Add a child to the background layer
   */
  addToBackgroundLayer(child: Container): void {
    this._backgroundLayer?.addChild(child);
  }

  /**
   * Clear all content
   */
  clear(): void {
    this._renderer?.clear();
    this._backgroundLayer?.removeChildren();
  }

  // =========================================================================
  // CONVENIENCE METHODS - Delegate to Renderer
  // =========================================================================

  /**
   * Add a node
   */
  addNode(input: NodeInput): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.addNode(input);
  }

  /**
   * Update a node
   */
  updateNode(id: string, updates: Partial<NodeInput>): void {
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
  addEdge(input: EdgeInput): void {
    if (!this._renderer) {
      throw new Error('Canvas not initialized. Call init() first.');
    }
    this._renderer.addEdge(input);
  }

  /**
   * Update an edge
   */
  updateEdge(id: string, updates: Partial<EdgeInput>): void {
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
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the canvas and clean up resources
   */
  destroy(): void {
    this._renderer?.destroy();
    this._renderer = null;

    this._viewport?.destroy();
    this._app?.destroy(true, { children: true });
    
    this._app = null;
    this._viewport = null;
    this._backgroundLayer = null;
    this._edgeLayer = null;
    this._nodeLayer = null;
    this._initialized = false;
  }
}
