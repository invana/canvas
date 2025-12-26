/**
 * Canvas
 * 
 * Main entry point for the canvas visualization engine.
 * Orchestrates the Application, Viewport, Registry, and content layers.
 * 
 * ## Architecture
 * 
 * ```
 * Canvas
 * ├── Application (PixiJS renderer)
 * ├── Viewport (pan/zoom)
 * │   └── content
 * │       ├── backgroundLayer
 * │       ├── edgeLayer
 * │       └── nodeLayer
 * └── Registry (extensible primitives)
 * ```
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container: document.getElementById('canvas')!,
 *   width: 800,
 *   height: 600,
 * });
 * 
 * await canvas.init();
 * 
 * // Add nodes and edges
 * canvas.addNode({ id: '1', x: 100, y: 100, shape: 'circle' });
 * canvas.addEdge({ id: 'e1', source: '1', target: '2' });
 * ```
 */

import { Application, Container } from 'pixi.js';
import { Viewport, type ViewportOptions } from './Viewport';
import { Registry } from './Registry';
import type { NodeShape } from '../ui-shapes/NodeShape';
import type { EdgeShape } from '../ui-shapes/EdgeShape';

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
}

export interface CanvasState {
  width: number;
  height: number;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export class Canvas {
  private _container: HTMLElement;
  private _app: Application | null = null;
  private _viewport: Viewport | null = null;
  private _registry: Registry;
  private _initialized: boolean = false;

  // Layers
  private _backgroundLayer: Container | null = null;
  private _edgeLayer: Container | null = null;
  private _nodeLayer: Container | null = null;

  // Graph tracking
  private _nodes: Map<string, NodeShape> = new Map();
  private _edges: Map<string, EdgeShape> = new Map();
  // Maps node ID to edges connected to it (both source and target)
  private _nodeEdges: Map<string, Set<string>> = new Map();

  // Options
  private _options: Required<CanvasOptions>;

  constructor(options: CanvasOptions) {
    this._container = options.container;
    this._registry = options.registry ?? new Registry();

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

    // Prevent browser context menu on canvas
    const canvasEl = this._app.canvas as HTMLCanvasElement;
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    this._initialized = true;
  }

  // =========================================================================
  // ACCESSORS
  // =========================================================================

  get app(): Application | null {
    return this._app;
  }

  get viewport(): Viewport | null {
    return this._viewport;
  }

  get registry(): Registry {
    return this._registry;
  }

  get backgroundLayer(): Container | null {
    return this._backgroundLayer;
  }

  get edgeLayer(): Container | null {
    return this._edgeLayer;
  }

  get nodeLayer(): Container | null {
    return this._nodeLayer;
  }

  get width(): number {
    return this._options.width;
  }

  get height(): number {
    return this._options.height;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get state(): CanvasState {
    return {
      width: this._options.width,
      height: this._options.height,
      viewport: this._viewport?.state ?? { x: 0, y: 0, zoom: 1 },
    };
  }

  // =========================================================================
  // PUBLIC METHODS
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
   * Get the renderer type (webgpu or webgl)
   */
  getRendererType(): string {
    if (!this._app) return 'unknown';
    return this._app.renderer.type === 0x0001 ? 'webgl' : 'webgpu';
  }

  /**
   * Add a child to the node layer (legacy - use addNode for graph tracking)
   */
  addToNodeLayer(child: Container): void {
    this._nodeLayer?.addChild(child);
    
    // If it's a NodeShape, register it for graph tracking
    if ('id' in child && 'data' in child) {
      const node = child as unknown as NodeShape;
      this._nodes.set(node.id, node);
      this._nodeEdges.set(node.id, new Set());
      
      // Set up drag callback to update connected edges
      node.onDrag = (draggedNode: NodeShape, x: number, y: number) => {
        this.handleNodeDrag(draggedNode, x, y);
      };
      
      // Also listen for drag events (for external listeners)
      node.on('drag', this.onNodeDrag, this);
    }
  }

  /**
   * Add a child to the edge layer (legacy - use addEdge for graph tracking)
   */
  addToEdgeLayer(child: Container, sourceNodeId?: string, targetNodeId?: string): void {
    this._edgeLayer?.addChild(child);
    
    // If it's an EdgeShape, register it for graph tracking
    if ('id' in child && 'source' in child && 'target' in child) {
      const edge = child as unknown as EdgeShape;
      this._edges.set(edge.id, edge);
      
      // Track node-edge relationships if IDs provided
      if (sourceNodeId) {
        const sourceEdges = this._nodeEdges.get(sourceNodeId);
        if (sourceEdges) {
          sourceEdges.add(edge.id);
        }
        (edge as any)._sourceNodeId = sourceNodeId;
      }
      
      if (targetNodeId) {
        const targetEdges = this._nodeEdges.get(targetNodeId);
        if (targetEdges) {
          targetEdges.add(edge.id);
        }
        (edge as any)._targetNodeId = targetNodeId;
      }
    }
  }

  /**
   * Add a node with graph tracking
   */
  addNode(node: NodeShape): void {
    this._nodeLayer?.addChild(node);
    this._nodes.set(node.id, node);
    this._nodeEdges.set(node.id, new Set());
    
    // Set up drag callback to update connected edges
    node.onDrag = (draggedNode: NodeShape, x: number, y: number) => {
      this.handleNodeDrag(draggedNode, x, y);
    };
    
    // Also listen for drag events (for external listeners)
    node.on('drag', this.onNodeDrag, this);
  }

  /**
   * Add an edge with graph tracking
   */
  addEdge(edge: EdgeShape, sourceNodeId?: string, targetNodeId?: string): void {
    this._edgeLayer?.addChild(edge);
    this._edges.set(edge.id, edge);
    
    // Track node-edge relationships
    if (sourceNodeId) {
      const sourceEdges = this._nodeEdges.get(sourceNodeId);
      if (sourceEdges) {
        sourceEdges.add(edge.id);
      }
      // Store reference on edge for quick lookup
      (edge as any)._sourceNodeId = sourceNodeId;
    }
    
    if (targetNodeId) {
      const targetEdges = this._nodeEdges.get(targetNodeId);
      if (targetEdges) {
        targetEdges.add(edge.id);
      }
      // Store reference on edge for quick lookup
      (edge as any)._targetNodeId = targetNodeId;
    }
  }

  /**
   * Handle node drag via callback - update connected edges
   */
  private handleNodeDrag(node: NodeShape, x: number, y: number): void {
    const nodeId = node.id;
    const edgeIds = this._nodeEdges.get(nodeId);
    
    if (!edgeIds || edgeIds.size === 0) {
      return;
    }
    
    edgeIds.forEach((edgeId) => {
      const edge = this._edges.get(edgeId);
      if (!edge) return;
      
      // Check if this node is source or target
      const isSource = (edge as any)._sourceNodeId === nodeId;
      const isTarget = (edge as any)._targetNodeId === nodeId;
      
      if (isSource || isTarget) {
        const newSource = isSource 
          ? { x, y }
          : edge.source;
        const newTarget = isTarget 
          ? { x, y }
          : edge.target;
        
        edge.updateEndpoints(newSource, newTarget);
      }
    });
  }

  /**
   * Handle node drag event - update connected edges
   */
  private onNodeDrag(event: { node: NodeShape; x: number; y: number }): void {
    const nodeId = event.node.id;
    const edgeIds = this._nodeEdges.get(nodeId);
    
    if (!edgeIds || edgeIds.size === 0) {
      return;
    }
    
    edgeIds.forEach((edgeId) => {
      const edge = this._edges.get(edgeId);
      if (!edge) return;
      
      // Check if this node is source or target
      const isSource = (edge as any)._sourceNodeId === nodeId;
      const isTarget = (edge as any)._targetNodeId === nodeId;
      
      if (isSource || isTarget) {
        const newSource = isSource 
          ? { x: event.x, y: event.y }
          : edge.source;
        const newTarget = isTarget 
          ? { x: event.x, y: event.y }
          : edge.target;
        
        edge.updateEndpoints(newSource, newTarget);
      }
    });
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): NodeShape | undefined {
    return this._nodes.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): EdgeShape | undefined {
    return this._edges.get(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): NodeShape[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): EdgeShape[] {
    return Array.from(this._edges.values());
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): EdgeShape[] {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds) return [];
    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((e): e is EdgeShape => e !== undefined);
  }

  /**
   * Remove a node and its connected edges
   */
  removeNode(nodeId: string): void {
    const node = this._nodes.get(nodeId);
    if (!node) return;
    
    // Remove connected edges
    const edgeIds = this._nodeEdges.get(nodeId);
    if (edgeIds) {
      edgeIds.forEach((edgeId) => this.removeEdge(edgeId));
    }
    
    // Remove node
    node.off('drag', this.onNodeDrag, this);
    node.destroy();
    this._nodes.delete(nodeId);
    this._nodeEdges.delete(nodeId);
  }

  /**
   * Remove an edge
   */
  removeEdge(edgeId: string): void {
    const edge = this._edges.get(edgeId);
    if (!edge) return;
    
    // Remove from node-edge tracking
    const sourceNodeId = (edge as any)._sourceNodeId;
    const targetNodeId = (edge as any)._targetNodeId;
    
    if (sourceNodeId) {
      this._nodeEdges.get(sourceNodeId)?.delete(edgeId);
    }
    if (targetNodeId) {
      this._nodeEdges.get(targetNodeId)?.delete(edgeId);
    }
    
    edge.destroy();
    this._edges.delete(edgeId);
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
    // Clean up graph tracking
    this._nodes.forEach((node) => {
      node.off('drag', this.onNodeDrag, this);
    });
    this._nodes.clear();
    this._edges.clear();
    this._nodeEdges.clear();
    
    this._backgroundLayer?.removeChildren();
    this._edgeLayer?.removeChildren();
    this._nodeLayer?.removeChildren();
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
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the canvas and clean up resources
   */
  destroy(): void {
    // Clean up graph tracking
    this._nodes.forEach((node) => {
      node.off('drag', this.onNodeDrag, this);
    });
    this._nodes.clear();
    this._edges.clear();
    this._nodeEdges.clear();
    
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
