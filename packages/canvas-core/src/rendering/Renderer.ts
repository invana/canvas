/**
 * Renderer
 * 
 * Manages all graphics rendering: creating, updating, and removing nodes and edges.
 * Handles the relationship between nodes and their connected edges.
 * 
 * @example
 * ```typescript
 * const renderer = new Renderer({ registry, layers });
 * 
 * // Add graphics
 * const node = renderer.addNode({ id: 'n1', x: 100, y: 100, shape: 'circle' });
 * const edge = renderer.addEdge({ 
 *   id: 'e1', 
 *   source: 'n1', 
 *   target: 'n2', 
 *   pathType: 'bezier' 
 * });
 * 
 * // Update graphics
 * renderer.updateNode('n1', { x: 200, y: 200 });
 * 
 * // Remove graphics
 * renderer.removeNode('n1'); // Also removes connected edges
 * ```
 */

import { Container } from 'pixi.js';
import { Registry } from './Registry';
import { 
  NodeShapeBase, 
  createNode, 
  type NodeData, 
  type NodeStyle 
} from '../elements/nodes';
import { 
  EdgeShapeBase, 
  createEdge, 
  type EdgeData, 
  type EdgeStyle 
} from '../elements/edges';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Node input data (can reference source/target by ID or point)
 */
export interface NodeInput extends Omit<NodeData, 'x' | 'y'> {
  x: number;
  y: number;
  style?: Partial<NodeStyle>;
  interactive?: boolean;
  draggable?: boolean;
  selectable?: boolean;
}

/**
 * Edge input data (can reference source/target by ID or point)
 */
export interface EdgeInput extends Omit<EdgeData, 'source' | 'target' | 'x' | 'y'> {
  /** Source node ID or point */
  source: string | Point;
  /** Target node ID or point */
  target: string | Point;
  style?: Partial<EdgeStyle>;
}

/**
 * Renderer options
 */
export interface RendererOptions {
  /** The registry for drawing primitives */
  registry: Registry;
  /** The node layer container */
  nodeLayer: Container;
  /** The edge layer container */
  edgeLayer: Container;
  /** Default node style */
  defaultNodeStyle?: Partial<NodeStyle>;
  /** Default edge style */
  defaultEdgeStyle?: Partial<EdgeStyle>;
  /** Offset from node boundary for edges */
  edgeBoundaryOffset?: number;
  /** Callback when a node is dragged */
  onNodeDrag?: (node: NodeShapeBase, x: number, y: number) => void;
}

/**
 * Internal edge tracking with source/target node references
 */
interface EdgeTracking {
  edge: EdgeShapeBase;
  sourceNodeId?: string;
  targetNodeId?: string;
  sourcePoint?: Point;
  targetPoint?: Point;
}

// ============================================================================
// RENDERER
// ============================================================================

export class Renderer {
  private _registry: Registry;
  private _nodeLayer: Container;
  private _edgeLayer: Container;
  
  // Graphics storage
  private _nodes: Map<string, NodeShapeBase> = new Map();
  private _edges: Map<string, EdgeTracking> = new Map();
  
  // Node-edge relationships (node ID → set of edge IDs)
  private _nodeEdges: Map<string, Set<string>> = new Map();
  
  // Styles
  private _defaultNodeStyle: NodeStyle;
  private _defaultEdgeStyle: EdgeStyle;
  private _edgeBoundaryOffset: number;
  
  // Callbacks
  private _onNodeDrag?: (node: NodeShapeBase, x: number, y: number) => void;

  constructor(options: RendererOptions) {
    this._registry = options.registry;
    this._nodeLayer = options.nodeLayer;
    this._edgeLayer = options.edgeLayer;
    this._edgeBoundaryOffset = options.edgeBoundaryOffset ?? 2;
    this._onNodeDrag = options.onNodeDrag;
    
    this._defaultNodeStyle = {
      fill: '#4a90d9',
      stroke: '#2d5a87',
      strokeWidth: 2,
      ...options.defaultNodeStyle,
    };
    
    this._defaultEdgeStyle = {
      stroke: '#666666',
      strokeWidth: 2,
      ...options.defaultEdgeStyle,
    };
  }

  // =========================================================================
  // NODE OPERATIONS
  // =========================================================================

  /**
   * Add a node to the canvas
   */
  addNode(input: NodeInput): NodeShapeBase {
    const { interactive, draggable, selectable, ...restData } = input;
    
    // Separate style properties from data properties
    const styleProps: Partial<NodeStyle> = {};
    const dataProps: Partial<NodeInput> = {};
    const styleKeys: (keyof NodeStyle)[] = [
      'fill', 'stroke', 'strokeWidth', 
      'hoverFill', 'hoverStroke', 
      'selectedFill', 'selectedStroke', 'selectedStrokeWidth',
      'labelPosition', 'labelOffsetX', 'labelOffsetY', 'labelStyle', 'rippleColor'
    ];
    
    for (const key in restData) {
      if (styleKeys.includes(key as keyof NodeStyle)) {
        styleProps[key as keyof NodeStyle] = (restData as any)[key];
      } else {
        (dataProps as any)[key] = (restData as any)[key];
      }
    }
    
    const mergedStyle: NodeStyle = {
      ...this._defaultNodeStyle,
      ...styleProps,
    };
    
    const node = createNode({
      data: dataProps as NodeData,
      style: mergedStyle,
      interactive: interactive ?? true,
      draggable: draggable ?? true,
      selectable: selectable ?? true,
      registry: this._registry,
    });
    
    // Store and add to layer
    this._nodes.set(node.id, node);
    this._nodeEdges.set(node.id, new Set());
    this._nodeLayer.addChild(node);
    
    // Set up drag handling
    this.setupNodeDragHandling(node);
    
    return node;
  }

  /**
   * Update a node's properties
   */
  updateNode(id: string, updates: Partial<NodeInput>): NodeShapeBase | undefined {
    const node = this._nodes.get(id);
    if (!node) return undefined;
    
    // Update position
    if (updates.x !== undefined) node.x = updates.x;
    if (updates.y !== undefined) node.y = updates.y;
    
    // Extract style properties from updates
    const styleProps: Partial<NodeStyle> = {};
    const styleKeys: (keyof NodeStyle)[] = [
      'fill', 'stroke', 'strokeWidth', 
      'hoverFill', 'hoverStroke', 
      'selectedFill', 'selectedStroke', 'selectedStrokeWidth',
      'labelPosition', 'labelOffsetX', 'labelOffsetY', 'labelStyle', 'rippleColor'
    ];
    
    for (const key in updates) {
      if (styleKeys.includes(key as keyof NodeStyle)) {
        styleProps[key as keyof NodeStyle] = (updates as any)[key];
      }
    }
    
    // Update style
    if (Object.keys(styleProps).length > 0) {
      node.nodeStyle = { ...node.nodeStyle, ...styleProps };
    }
    
    // Update label (updates the data then refreshes the label)
    if (updates.label !== undefined) {
      (node as any)._data.label = updates.label;
      node.updateLabel();
    }
    
    // Update connected edges if position changed
    if (updates.x !== undefined || updates.y !== undefined) {
      this.updateConnectedEdges(id, node.x, node.y);
    }
    
    return node;
  }

  /**
   * Remove a node and its connected edges
   */
  removeNode(id: string): boolean {
    const node = this._nodes.get(id);
    if (!node) return false;
    
    // Remove all connected edges first
    const connectedEdgeIds = this._nodeEdges.get(id);
    if (connectedEdgeIds) {
      for (const edgeId of connectedEdgeIds) {
        this.removeEdge(edgeId);
      }
    }
    
    // Clean up event listeners
    node.off('drag', this.handleNodeDragEvent, this);
    
    // Remove from layer and storage
    this._nodeLayer.removeChild(node);
    node.destroy();
    this._nodes.delete(id);
    this._nodeEdges.delete(id);
    
    return true;
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): NodeShapeBase | undefined {
    return this._nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): NodeShapeBase[] {
    return Array.from(this._nodes.values());
  }

  /**
   * Get node count
   */
  get nodeCount(): number {
    return this._nodes.size;
  }

  // =========================================================================
  // EDGE OPERATIONS
  // =========================================================================

  /**
   * Add an edge to the canvas
   */
  addEdge(input: EdgeInput): EdgeShapeBase {
    const { source, target, ...restData } = input;
    
    // Extract style properties from input
    const styleProps: Partial<EdgeStyle> = {};
    const dataProps: Partial<EdgeInput> = { source, target };
    const styleKeys: (keyof EdgeStyle)[] = [
      'stroke', 'strokeWidth', 'strokeAlpha', 'lineCap', 'lineJoin',
      'visible', 'alpha', 'cursor', 'arrowFill', 'arrowStroke'
    ];
    
    // Separate style properties from data properties
    for (const key in restData) {
      if (styleKeys.includes(key as keyof EdgeStyle)) {
        styleProps[key as keyof EdgeStyle] = (restData as any)[key];
      } else {
        (dataProps as any)[key] = (restData as any)[key];
      }
    }
    
    // Resolve source and target
    const { point: sourcePoint, nodeId: sourceNodeId, node: sourceNode } = 
      this.resolveEdgeEndpoint(source);
    const { point: targetPoint, nodeId: targetNodeId, node: targetNode } = 
      this.resolveEdgeEndpoint(target);
    
    // Calculate boundary-adjusted points
    const adjustedPoints = this.calculateBoundaryPoints(
      sourceNode,
      targetNode,
      sourcePoint,
      targetPoint
    );
    
    const mergedStyle: EdgeStyle = {
      ...this._defaultEdgeStyle,
      ...styleProps,
    };
    
    const edgeData: EdgeData = {
      ...dataProps,
      source: adjustedPoints.source,
      target: adjustedPoints.target,
      x: 0,
      y: 0,
    } as EdgeData;
    
    const edge = createEdge({
      data: edgeData,
      style: mergedStyle,
      registry: this._registry,
    });
    
    // Store tracking info
    const tracking: EdgeTracking = {
      edge,
      sourceNodeId,
      targetNodeId,
      sourcePoint: sourceNodeId ? undefined : sourcePoint,
      targetPoint: targetNodeId ? undefined : targetPoint,
    };
    
    this._edges.set(edge.id, tracking);
    this._edgeLayer.addChild(edge);
    
    // Track node-edge relationships
    if (sourceNodeId) {
      this._nodeEdges.get(sourceNodeId)?.add(edge.id);
    }
    if (targetNodeId) {
      this._nodeEdges.get(targetNodeId)?.add(edge.id);
    }
    
    return edge;
  }

  /**
   * Update an edge's properties
   */
  updateEdge(id: string, updates: Partial<EdgeInput>): EdgeShapeBase | undefined {
    const tracking = this._edges.get(id);
    if (!tracking) return undefined;
    
    const { edge } = tracking;
    
    // Extract style properties from updates
    const styleProps: Partial<EdgeStyle> = {};
    const styleKeys: (keyof EdgeStyle)[] = [
      'stroke', 'strokeWidth', 'strokeAlpha', 'lineCap', 'lineJoin',
      'visible', 'alpha', 'cursor', 'arrowFill', 'arrowStroke'
    ];
    
    for (const key in updates) {
      if (styleKeys.includes(key as keyof EdgeStyle)) {
        styleProps[key as keyof EdgeStyle] = (updates as any)[key];
      }
    }
    
    // Update style
    if (Object.keys(styleProps).length > 0) {
      edge.updateEdgeStyle(styleProps);
    }
    
    // Update endpoints if source/target changed
    if (updates.source !== undefined || updates.target !== undefined) {
      // Resolve new endpoints
      const newSource = updates.source ?? 
        (tracking.sourceNodeId ? tracking.sourceNodeId : tracking.sourcePoint!);
      const newTarget = updates.target ?? 
        (tracking.targetNodeId ? tracking.targetNodeId : tracking.targetPoint!);
      
      const { point: sourcePoint, nodeId: sourceNodeId, node: sourceNode } = 
        this.resolveEdgeEndpoint(newSource);
      const { point: targetPoint, nodeId: targetNodeId, node: targetNode } = 
        this.resolveEdgeEndpoint(newTarget);
      
      // Update tracking
      tracking.sourceNodeId = sourceNodeId;
      tracking.targetNodeId = targetNodeId;
      tracking.sourcePoint = sourceNodeId ? undefined : sourcePoint;
      tracking.targetPoint = targetNodeId ? undefined : targetPoint;
      
      // Calculate new boundary points
      const adjustedPoints = this.calculateBoundaryPoints(
        sourceNode,
        targetNode,
        sourcePoint,
        targetPoint
      );
      
      edge.updateEndpoints(adjustedPoints.source, adjustedPoints.target);
    }
    
    return edge;
  }

  /**
   * Remove an edge
   */
  removeEdge(id: string): boolean {
    const tracking = this._edges.get(id);
    if (!tracking) return false;
    
    const { edge, sourceNodeId, targetNodeId } = tracking;
    
    // Remove from node-edge tracking
    if (sourceNodeId) {
      this._nodeEdges.get(sourceNodeId)?.delete(id);
    }
    if (targetNodeId) {
      this._nodeEdges.get(targetNodeId)?.delete(id);
    }
    
    // Remove from layer and storage
    this._edgeLayer.removeChild(edge);
    edge.destroy();
    this._edges.delete(id);
    
    return true;
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): EdgeShapeBase | undefined {
    return this._edges.get(id)?.edge;
  }

  /**
   * Get all edges
   */
  getEdges(): EdgeShapeBase[] {
    return Array.from(this._edges.values()).map(t => t.edge);
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): EdgeShapeBase[] {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds) return [];
    
    return Array.from(edgeIds)
      .map(id => this._edges.get(id)?.edge)
      .filter((e): e is EdgeShapeBase => e !== undefined);
  }

  /**
   * Get edge count
   */
  get edgeCount(): number {
    return this._edges.size;
  }

  // =========================================================================
  // BULK OPERATIONS
  // =========================================================================

  /**
   * Add multiple nodes at once
   */
  addNodes(inputs: NodeInput[]): NodeShapeBase[] {
    return inputs.map(input => this.addNode(input));
  }

  /**
   * Add multiple edges at once
   */
  addEdges(inputs: EdgeInput[]): EdgeShapeBase[] {
    return inputs.map(input => this.addEdge(input));
  }

  /**
   * Clear all graphics
   */
  clear(): void {
    // Remove all edges first (to avoid issues with node-edge tracking)
    for (const id of this._edges.keys()) {
      this.removeEdge(id);
    }
    
    // Remove all nodes
    for (const id of this._nodes.keys()) {
      this.removeNode(id);
    }
  }

  // =========================================================================
  // SELECTION
  // =========================================================================

  /**
   * Select a node
   */
  selectNode(id: string): void {
    const node = this._nodes.get(id);
    if (node) {
      node.selected = true;
    }
  }

  /**
   * Deselect a node
   */
  deselectNode(id: string): void {
    const node = this._nodes.get(id);
    if (node) {
      node.selected = false;
    }
  }

  /**
   * Select an edge
   */
  selectEdge(id: string): void {
    const tracking = this._edges.get(id);
    if (tracking) {
      tracking.edge.selected = true;
    }
  }

  /**
   * Deselect an edge
   */
  deselectEdge(id: string): void {
    const tracking = this._edges.get(id);
    if (tracking) {
      tracking.edge.selected = false;
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    for (const node of this._nodes.values()) {
      node.selected = false;
    }
    for (const tracking of this._edges.values()) {
      tracking.edge.selected = false;
    }
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /**
   * Set up drag handling for a node
   */
  private setupNodeDragHandling(node: NodeShapeBase): void {
    node.onDrag = (draggedNode, x, y) => {
      this.updateConnectedEdges(draggedNode.id, x, y);
      this._onNodeDrag?.(draggedNode, x, y);
    };
    
    node.on('drag', this.handleNodeDragEvent, this);
  }

  /**
   * Handle node drag event
   */
  private handleNodeDragEvent(event: { node: NodeShapeBase; x: number; y: number }): void {
    this.updateConnectedEdges(event.node.id, event.x, event.y);
  }

  /**
   * Update all edges connected to a node when it moves
   */
  private updateConnectedEdges(nodeId: string, x: number, y: number): void {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds || edgeIds.size === 0) return;
    
    for (const edgeId of edgeIds) {
      const tracking = this._edges.get(edgeId);
      if (!tracking) continue;
      
      const { edge, sourceNodeId, targetNodeId } = tracking;
      const isSource = sourceNodeId === nodeId;
      const isTarget = targetNodeId === nodeId;
      
      if (!isSource && !isTarget) continue;
      
      // Get source and target positions
      const sourceNode = sourceNodeId ? this._nodes.get(sourceNodeId) : null;
      const targetNode = targetNodeId ? this._nodes.get(targetNodeId) : null;
      
      const sourceCenter = isSource 
        ? { x, y }
        : sourceNode 
          ? { x: sourceNode.x, y: sourceNode.y }
          : tracking.sourcePoint!;
      
      const targetCenter = isTarget
        ? { x, y }
        : targetNode
          ? { x: targetNode.x, y: targetNode.y }
          : tracking.targetPoint!;
      
      // Recalculate boundary points
      const adjustedPoints = this.calculateBoundaryPoints(
        sourceNode ?? null,
        targetNode ?? null,
        sourceCenter,
        targetCenter
      );
      
      edge.updateEndpoints(adjustedPoints.source, adjustedPoints.target);
    }
  }

  /**
   * Resolve an edge endpoint (node ID or point) to actual point and node reference
   */
  private resolveEdgeEndpoint(endpoint: string | Point): {
    point: Point;
    nodeId?: string;
    node: NodeShapeBase | null;
  } {
    if (typeof endpoint === 'string') {
      const node = this._nodes.get(endpoint);
      if (node) {
        return {
          point: { x: node.x, y: node.y },
          nodeId: endpoint,
          node,
        };
      }
      // Node not found - use origin as fallback
      console.warn(`Node not found: ${endpoint}`);
      return { point: { x: 0, y: 0 }, node: null };
    }
    
    return { point: endpoint, node: null };
  }

  /**
   * Calculate boundary-adjusted edge endpoints
   */
  private calculateBoundaryPoints(
    sourceNode: NodeShapeBase | null,
    targetNode: NodeShapeBase | null,
    sourceCenter: Point,
    targetCenter: Point
  ): { source: Point; target: Point } {
    let source = sourceCenter;
    let target = targetCenter;
    
    // Calculate direction
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const dirX = dx / distance;
      const dirY = dy / distance;
      
      // Adjust source point to node boundary
      if (sourceNode) {
        source = sourceNode.getBoundaryPoint(
          { x: dirX, y: dirY },
          this._edgeBoundaryOffset
        );
      }
      
      // Adjust target point to node boundary
      if (targetNode) {
        target = targetNode.getBoundaryPoint(
          { x: -dirX, y: -dirY },
          this._edgeBoundaryOffset
        );
      }
    }
    
    return { source, target };
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the renderer and clean up resources
   */
  destroy(): void {
    this.clear();
  }
}
