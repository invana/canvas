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
  type NodeData as NodeShapeData, 
  type NodeStyle 
} from '../elements/nodes';
import { 
  EdgeShapeBase, 
  type EdgeData as EdgeShapeData, 
  type EdgeStyle 
} from '../elements/edges';
import { CircleNode } from '../elements/nodes/CircleNode';
import { LineEdge } from '../elements/edges/LineEdge';

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
 * Node input for renderer - separates data from styling
 */
export interface NodeData {
  /** Core node data (id, position, label, properties) */
  data: NodeShapeData;
  /** Visual styling */
  style?: Partial<NodeStyle>;
  /** Enable interactivity */
  interactive?: boolean;
  /** Enable dragging */
  draggable?: boolean;
  /** Enable selection */
  selectable?: boolean;
}

/**
 * Edge input for renderer - separates data from styling
 */
export interface EdgeData {
  /** Core edge data */
  data: Omit<EdgeShapeData, 'source' | 'target'> & {
    /** Source node ID or point */
    source: string | Point;
    /** Target node ID or point */
    target: string | Point;
  };
  /** Visual styling */
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
  addNode(input: NodeData): NodeShapeBase {
    const { data, style, interactive, draggable, selectable } = input;
    
    const mergedStyle: NodeStyle = {
      ...this._defaultNodeStyle,
      ...style,
    };
    
    // Create node using registry
    const shapeType = data.shape ?? 'circle';
    const NodeClass = this._registry.getNodeClass(shapeType);
    
    if (!NodeClass) {
      console.warn(`Unknown node shape type: ${shapeType}, defaulting to circle`);
    }
    
    const node = new (NodeClass ?? CircleNode)({
      data,
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
    
    // Initial render after node is in scene graph
    node.forceRender();
    node.updateLabel();
    node.updateBadges();
    
    // Set up drag handling
    this.setupNodeDragHandling(node);
    
    return node;
  }

  /**
   * Update a node's properties
   */
  updateNode(id: string, updates: Partial<NodeData>): NodeShapeBase | undefined {
    const node = this._nodes.get(id);
    if (!node) return undefined;
    
    // Update data properties
    if (updates.data) {
      if (updates.data.x !== undefined) node.x = updates.data.x;
      if (updates.data.y !== undefined) node.y = updates.data.y;
      
      // Update label
      if (updates.data.label !== undefined) {
        (node as any)._data.label = updates.data.label;
        node.updateLabel();
      }
      
      // Update connected edges if position changed
      if (updates.data.x !== undefined || updates.data.y !== undefined) {
        this.updateConnectedEdges(id, node.x, node.y);
      }
    }
    
    // Update style
    if (updates.style) {
      node.nodeStyle = { ...node.nodeStyle, ...updates.style };
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
  addEdge(input: EdgeData): EdgeShapeBase {
    const { data, style } = input;
    const { source, target } = data;
    
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
      ...style,
    };
    
    // Create edge data with resolved points
    const edgeData: EdgeShapeData = {
      id: data.id,
      source: adjustedPoints.source,
      target: adjustedPoints.target,
      x: 0,
      y: 0,
      pathType: data.pathType,
      curvature: data.curvature,
      sourceDirection: data.sourceDirection,
      targetDirection: data.targetDirection,
      arrowSource: data.arrowSource,
      arrowTarget: data.arrowTarget,
      arrowSize: data.arrowSize,
      label: data.label,
      payload: data.payload,
    } as EdgeShapeData;
    
    // Create edge using registry  
    const pathType = (data.pathType as string) ?? 'line';
    const EdgeClass = this._registry.getEdgeClass?.(pathType);
    
    if (!EdgeClass) {
      console.warn(`Unknown edge path type: ${pathType}, defaulting to straight line`);
    }
    
    const edge = new (EdgeClass ?? LineEdge)({
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
  updateEdge(id: string, updates: Partial<EdgeData>): EdgeShapeBase | undefined {
    const tracking = this._edges.get(id);
    if (!tracking) return undefined;
    
    const { edge } = tracking;
    
    // Update style
    if (updates.style) {
      edge.updateEdgeStyle(updates.style);
    }
    
    // Update endpoints if source/target changed
    if (updates.data?.source !== undefined || updates.data?.target !== undefined) {
      // Resolve new endpoints
      const newSource = updates.data.source ?? 
        (tracking.sourceNodeId ? tracking.sourceNodeId : tracking.sourcePoint!);
      const newTarget = updates.data.target ?? 
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
  addNodes(inputs: NodeData[]): NodeShapeBase[] {
    return inputs.map(input => this.addNode(input));
  }

  /**
   * Add multiple edges at once
   */
  addEdges(inputs: EdgeData[]): EdgeShapeBase[] {
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
