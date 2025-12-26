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
 * // Data-driven approach (recommended)
 * const canvas = new Canvas({
 *   container: document.getElementById('canvas')!,
 *   width: 800,
 *   height: 600,
 *   data: {
 *     nodes: [
 *       { id: '1', x: 100, y: 100, shape: 'circle', label: 'Node 1' },
 *       { id: '2', x: 300, y: 200, shape: 'roundedRect', label: 'Node 2' },
 *     ],
 *     edges: [
 *       { id: 'e1', source: '1', target: '2', pathType: 'bezier' },
 *     ],
 *   },
 * });
 * 
 * await canvas.init();
 * canvas.render();
 * ```
 */

import { Application, Container } from 'pixi.js';
import { Viewport, type ViewportOptions } from './Viewport';
import { Registry } from './Registry';
import { NodeShapeBase, createNode, type NodeData, type NodeStyle } from '../ui-shapes/nodes';
import { EdgeShapeBase, createEdge, type EdgeData, type EdgeStyle } from '../ui-shapes/edges';

/**
 * Node configuration in CanvasData
 */
export interface CanvasNodeData extends NodeData {
  /** Node style */
  style?: Partial<NodeStyle>;
  /** Whether node is interactive */
  interactive?: boolean;
  /** Whether node is draggable */
  draggable?: boolean;
  /** Whether node is selectable */
  selectable?: boolean;
}

/**
 * Edge configuration in CanvasData
 * Source and target can be node IDs (strings) for automatic position resolution
 */
export interface CanvasEdgeData extends Omit<EdgeData, 'source' | 'target'> {
  /** Source node ID or point */
  source: string | { x: number; y: number };
  /** Target node ID or point */
  target: string | { x: number; y: number };
  /** Edge style */
  style?: Partial<EdgeStyle>;
}

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
  private _nodes: Map<string, NodeShapeBase> = new Map();
  private _edges: Map<string, EdgeShapeBase> = new Map();
  // Maps node ID to edges connected to it (both source and target)
  private _nodeEdges: Map<string, Set<string>> = new Map();

  // Data
  private _data: CanvasData | null = null;
  private _styles: CanvasStyles = {};

  // Options
  private _options: Required<Omit<CanvasOptions, 'data' | 'styles'>>;

  constructor(options: CanvasOptions) {
    this._container = options.container;
    this._registry = options.registry ?? new Registry();
    this._data = options.data ?? null;
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
   * Set new data and optionally re-render
   */
  setData(data: CanvasData, render: boolean = true): void {
    this._data = data;
    if (render) {
      this.render();
    }
  }

  /**
   * Get current data
   */
  getData(): CanvasData | null {
    return this._data;
  }

  /**
   * Set default styles
   */
  setStyles(styles: CanvasStyles): void {
    this._styles = styles;
  }

  // =========================================================================
  // EDGE BOUNDARY CALCULATION
  // =========================================================================

  /**
   * Calculate the source and target boundary points for an edge between two nodes.
   * Delegates to each node's getBoundaryPoint() method for shape-specific calculations.
   */
  private calculateEdgeBoundaryPoints(
    sourceNode: NodeShapeBase | null,
    targetNode: NodeShapeBase | null,
    sourcePoint: { x: number; y: number },
    targetPoint: { x: number; y: number },
    offset: number = 2
  ): { source: { x: number; y: number }; target: { x: number; y: number } } {
    const adjustedSource = sourceNode 
      ? sourceNode.getBoundaryPoint(targetPoint, offset)
      : sourcePoint;

    const adjustedTarget = targetNode 
      ? targetNode.getBoundaryPoint(sourcePoint, offset)
      : targetPoint;

    return { source: adjustedSource, target: adjustedTarget };
  }

  /**
   * Render the canvas data (nodes and edges)
   * Clears existing content and re-renders from data
   */
  render(): void {
    if (!this._initialized || !this._data) return;

    // Clear existing content
    this.clear();

    const defaultNodeStyle: Partial<NodeStyle> = {
      fill: '#4a90d9',
      stroke: '#333',
      strokeWidth: 2,
      labelPosition: 'center',
      labelStyle: { fill: '#ffffff', fontSize: 12 },
      ...this._styles.node,
    };

    const defaultEdgeStyle: Partial<EdgeStyle> = {
      stroke: '#666',
      strokeWidth: 2,
      ...this._styles.edge,
    };

    // First pass: create all nodes
    for (const nodeData of this._data.nodes) {
      const style: NodeStyle = {
        ...defaultNodeStyle,
        ...nodeData.style,
      } as NodeStyle;

      const node = createNode({
        data: {
          id: nodeData.id,
          x: nodeData.x,
          y: nodeData.y,
          shape: nodeData.shape ?? 'circle',
          size: nodeData.size ?? 30,
          width: nodeData.width,
          height: nodeData.height,
          cornerRadius: nodeData.cornerRadius,
          label: nodeData.label,
          payload: nodeData.payload,
        },
        style,
        interactive: nodeData.interactive ?? true,
        draggable: nodeData.draggable ?? true,
        selectable: nodeData.selectable ?? true,
        registry: this._registry,
      });

      this.addNode(node);
    }

    // Second pass: create all edges (after nodes exist for position lookup)
    for (const edgeData of this._data.edges) {
      // Resolve source position and node
      let sourcePoint: { x: number; y: number };
      let sourceNodeId: string | undefined;
      let sourceNode: NodeShapeBase | null = null;
      
      if (typeof edgeData.source === 'string') {
        sourceNode = this._nodes.get(edgeData.source) ?? null;
        if (!sourceNode) {
          console.warn(`Edge ${edgeData.id}: source node "${edgeData.source}" not found`);
          continue;
        }
        sourcePoint = { x: sourceNode.x, y: sourceNode.y };
        sourceNodeId = edgeData.source;
      } else {
        sourcePoint = edgeData.source;
      }

      // Resolve target position and node
      let targetPoint: { x: number; y: number };
      let targetNodeId: string | undefined;
      let targetNode: NodeShapeBase | null = null;
      
      if (typeof edgeData.target === 'string') {
        targetNode = this._nodes.get(edgeData.target) ?? null;
        if (!targetNode) {
          console.warn(`Edge ${edgeData.id}: target node "${edgeData.target}" not found`);
          continue;
        }
        targetPoint = { x: targetNode.x, y: targetNode.y };
        targetNodeId = edgeData.target;
      } else {
        targetPoint = edgeData.target;
      }

      // Calculate boundary points (edges should stop at node boundary, not center)
      // Add small offset (2px) for stroke width
      const boundaryPoints = this.calculateEdgeBoundaryPoints(
        sourceNode,
        targetNode,
        sourcePoint,
        targetPoint,
        2
      );

      const style: EdgeStyle = {
        ...defaultEdgeStyle,
        ...edgeData.style,
      } as EdgeStyle;

      const edge = createEdge({
        data: {
          id: edgeData.id,
          source: boundaryPoints.source,
          target: boundaryPoints.target,
          pathType: edgeData.pathType ?? 'bezier',
          curvature: edgeData.curvature,
          sourceDirection: edgeData.sourceDirection,
          targetDirection: edgeData.targetDirection,
          arrowSource: edgeData.arrowSource,
          arrowTarget: edgeData.arrowTarget ?? 'triangle',
          arrowSize: edgeData.arrowSize,
          label: edgeData.label,
          payload: edgeData.payload,
        },
        style,
        registry: this._registry,
      });

      this.addEdge(edge, sourceNodeId, targetNodeId);
    }

    // Fit content if enabled
    if (this._options.fitOnRender) {
      // Use setTimeout to ensure layout is complete
      setTimeout(() => {
        this.fitContent(this._options.fitPadding);
      }, 0);
    }
  }

  /**
   * Add a child to the node layer (legacy - use addNode for graph tracking)
   */
  addToNodeLayer(child: Container): void {
    this._nodeLayer?.addChild(child);
    
    // If it's a NodeShape, register it for graph tracking
    if ('id' in child && 'data' in child) {
      const node = child as unknown as NodeShapeBase;
      this._nodes.set(node.id, node);
      this._nodeEdges.set(node.id, new Set());
      
      // Set up drag callback to update connected edges
      node.onDrag = (draggedNode, x, y) => {
        this.handleNodeDrag(draggedNode as NodeShapeBase, x, y);
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
      const edge = child as unknown as EdgeShapeBase;
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
  addNode(node: NodeShapeBase): void {
    this._nodeLayer?.addChild(node);
    this._nodes.set(node.id, node);
    this._nodeEdges.set(node.id, new Set());
    
    // Set up drag callback to update connected edges
    node.onDrag = (draggedNode, x, y) => {
      this.handleNodeDrag(draggedNode as NodeShapeBase, x, y);
    };
    
    // Also listen for drag events (for external listeners)
    node.on('drag', this.onNodeDrag, this);
  }

  /**
   * Add an edge with graph tracking
   */
  addEdge(edge: EdgeShapeBase, sourceNodeId?: string, targetNodeId?: string): void {
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
  private handleNodeDrag(node: NodeShapeBase, x: number, y: number): void {
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
        // Get the other node to calculate proper boundary points
        const sourceNodeId = (edge as any)._sourceNodeId;
        const targetNodeId = (edge as any)._targetNodeId;
        const sourceNode = sourceNodeId ? this._nodes.get(sourceNodeId) ?? null : null;
        const targetNode = targetNodeId ? this._nodes.get(targetNodeId) ?? null : null;
        
        // Get center points (for nodes, use current position; for the dragged node, use new position)
        const sourceCenter = isSource 
          ? { x, y }
          : sourceNode ? { x: sourceNode.x, y: sourceNode.y } : edge.source;
        const targetCenter = isTarget 
          ? { x, y }
          : targetNode ? { x: targetNode.x, y: targetNode.y } : edge.target;
        
        // Calculate boundary-adjusted points
        const boundaryPoints = this.calculateEdgeBoundaryPoints(
          sourceNode,
          targetNode,
          sourceCenter,
          targetCenter,
          2
        );
        
        edge.updateEndpoints(boundaryPoints.source, boundaryPoints.target);
      }
    });
  }

  /**
   * Handle node drag event - update connected edges
   */
  private onNodeDrag(event: { node: NodeShapeBase; x: number; y: number }): void {
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
        // Get the other node to calculate proper boundary points
        const sourceNodeId = (edge as any)._sourceNodeId;
        const targetNodeId = (edge as any)._targetNodeId;
        const sourceNode = sourceNodeId ? this._nodes.get(sourceNodeId) ?? null : null;
        const targetNode = targetNodeId ? this._nodes.get(targetNodeId) ?? null : null;
        
        // Get center points (for nodes, use current position; for the dragged node, use new position)
        const sourceCenter = isSource 
          ? { x: event.x, y: event.y }
          : sourceNode ? { x: sourceNode.x, y: sourceNode.y } : edge.source;
        const targetCenter = isTarget 
          ? { x: event.x, y: event.y }
          : targetNode ? { x: targetNode.x, y: targetNode.y } : edge.target;
        
        // Calculate boundary-adjusted points
        const boundaryPoints = this.calculateEdgeBoundaryPoints(
          sourceNode,
          targetNode,
          sourceCenter,
          targetCenter,
          2
        );
        
        edge.updateEndpoints(boundaryPoints.source, boundaryPoints.target);
      }
    });
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): NodeShapeBase | undefined {
    return this._nodes.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): EdgeShapeBase | undefined {
    return this._edges.get(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): NodeShapeBase[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Get all edges
   */
  getEdges(): EdgeShapeBase[] {
    return Array.from(this._edges.values());
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): EdgeShapeBase[] {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds) return [];
    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((e): e is EdgeShapeBase => e !== undefined);
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
