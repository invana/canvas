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
  resolveNodeStyle,
  resolveEdgeStyle,
  type FunctionBasedNodeStyle, 
  type FunctionBasedEdgeStyle 
} from '../style/FunctionBasedStyle';
import { 
  RendererNodeBase, 
  type RendererNode, 
  type NodeStyle,
  type NodeShapeType,
  type RendererBadge
} from '../elements/nodes';
import { 
  RendererEdgeBase, 
  type RendererEdge, 
  type EdgeStyle,
  type EdgePathType
} from '../elements/edges';
import { type ArrowType } from '../primitives/arrows/types';
import { CircleNode } from '../elements/nodes/CircleNode';
import { LineEdge } from '../elements/edges/LineEdge';
import { NodeStates, EdgeStates } from '../types/states';

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
 * Public API: Node configuration for canvas
 * This is what users provide when adding nodes to the canvas
 */
export interface CanvasNode {
  // Core properties
  id: string;
  x: number;
  y: number;
  label?: string;
  shape?: NodeShapeType;
  
  // Size properties
  size?: number;
  width?: number;
  height?: number;
  cornerRadius?: number;
  
  // User data
  payload?: Record<string, unknown>;
  
  // Visual styling
  style?: Partial<NodeStyle>;
  
  // Initial states
  states?: string[];
  
  // Badges
  badges?: RendererBadge[];
}

/**
 * Public API: Edge configuration for canvas
 * This is what users provide when adding edges to the canvas
 */
export interface CanvasEdge {
  // Core properties
  id: string;
  source: string | Point;
  target: string | Point;
  
  // Path properties
  pathType?: EdgePathType;
  curvature?: number;
  label?: string;
  sourceDirection?: 'top' | 'bottom' | 'left' | 'right';
  targetDirection?: 'top' | 'bottom' | 'left' | 'right';
  
  // Arrows
  arrowSource?: ArrowType | 'none';
  arrowTarget?: ArrowType | 'none';
  arrowSize?: number;
  
  // User data
  payload?: Record<string, unknown>;
  
  // Visual styling
  style?: Partial<EdgeStyle>;
  
  // Initial states
  states?: string[];
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
  /** Default node style (supports function-based properties) */
  defaultNodeStyle?: Partial<FunctionBasedNodeStyle>;
  /** User-provided node style (supports function-based properties) */
  userNodeStyle?: Partial<FunctionBasedNodeStyle>;
  /** Default edge style (supports function-based properties) */
  defaultEdgeStyle?: Partial<FunctionBasedEdgeStyle>;
  /** User-provided edge style (supports function-based properties) */
  userEdgeStyle?: Partial<FunctionBasedEdgeStyle>;
  /** Offset from node boundary for edges */
  edgeBoundaryOffset?: number;
  /** Callback when a node is dragged */
  onNodeDrag?: (node: RendererNodeBase, x: number, y: number) => void;
}

/**
 * Internal edge tracking with source/target node references
 */
interface EdgeTracking {
  edge: RendererEdgeBase;
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
  private _nodes: Map<string, RendererNodeBase> = new Map();
  private _edges: Map<string, EdgeTracking> = new Map();
  
  // Node-edge relationships (node ID → set of edge IDs)
  private _nodeEdges: Map<string, Set<string>> = new Map();
  
  // Styles (may contain function-based properties)
  private _defaultNodeStyle: Partial<FunctionBasedNodeStyle>;
  private _userNodeStyle: Partial<FunctionBasedNodeStyle>;
  private _defaultEdgeStyle: Partial<FunctionBasedEdgeStyle>;
  private _userEdgeStyle: Partial<FunctionBasedEdgeStyle>;
  private _edgeBoundaryOffset: number;
  
  // Callbacks

  constructor(options: RendererOptions) {
    this._registry = options.registry;
    this._nodeLayer = options.nodeLayer;
    this._edgeLayer = options.edgeLayer;
    this._edgeBoundaryOffset = options.edgeBoundaryOffset ?? 2;
    
    this._defaultNodeStyle = options.defaultNodeStyle ?? {};
    this._userNodeStyle = options.userNodeStyle ?? {};
    this._defaultEdgeStyle = options.defaultEdgeStyle ?? {};
    this._userEdgeStyle = options.userEdgeStyle ?? {};
  }

  // =========================================================================
  // NODE OPERATIONS
  // =========================================================================

  /**
   * Add a node to the canvas
   */
  addNode(input: CanvasNode): RendererNodeBase {
    const { 
      id, x, y, label, shape, size, width, height, cornerRadius, payload, badges,
      style, states 
    } = input;
    
    // Create node data structure first (needed for function evaluation)
    const nodeData: RendererNode = {
      id,
      x,
      y,
      label,
      shape,
      size,
      width,
      height,
      cornerRadius,
      payload,
      badges,
    };
    
    // Resolve styles with function-based property evaluation
    const mergedStyle = resolveNodeStyle(
      nodeData,
      this._defaultNodeStyle,
      this._userNodeStyle,
      style as Partial<FunctionBasedNodeStyle>
    );
    
    // Create node using registry
    const shapeType = shape ?? 'circle';
    const NodeClass = this._registry.getNodeClass(shapeType);
    
    if (!NodeClass) {
      console.warn(`Unknown node shape type: ${shapeType}, defaulting to circle`);
    }
    
    const node = new (NodeClass ?? CircleNode)({
      data: nodeData,
      style: mergedStyle,
      states,
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
  updateNode(id: string, updates: Partial<CanvasNode>): RendererNodeBase | undefined {
    const node = this._nodes.get(id);
    if (!node) return undefined;
    
    // Update position
    if (updates.x !== undefined) node.x = updates.x;
    if (updates.y !== undefined) node.y = updates.y;
    
    // Update label
    if (updates.label !== undefined) {
      (node as any)._data.label = updates.label;
      node.updateLabel();
    }
    
    // Update connected edges if position changed
    if (updates.x !== undefined || updates.y !== undefined) {
      this.updateConnectedEdges(id, node.x, node.y);
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
  getNode(id: string): RendererNodeBase | undefined {
    return this._nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getNodes(): RendererNodeBase[] {
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
  addEdge(input: CanvasEdge): RendererEdgeBase {
    const { 
      id, source, target, pathType, curvature, sourceDirection, targetDirection,
      arrowSource, arrowTarget, arrowSize, label, payload, style, states 
    } = input;
    
    // Resolve source and target
    const { point: sourcePoint, nodeId: sourceNodeId, node: sourceNode} = 
      this.resolveEdgeEndpoint(source);
    const { point: targetPoint, nodeId: targetNodeId, node: targetNode } = 
      this.resolveEdgeEndpoint(target);
    
    // Validate endpoints
    if (!sourcePoint || !targetPoint) {
      const error = `Invalid edge endpoints for edge ${id}: source=${JSON.stringify(source)}, target=${JSON.stringify(target)}`;
      console.error(error);
      throw new Error(error);
    }
    
    // Create edge using registry  
    const edgePathType = (pathType as string) ?? 'line';
    const EdgeClass = this._registry.getEdgeClass?.(edgePathType);
    
    if (!EdgeClass) {
      console.warn(`Unknown edge path type: ${edgePathType}, defaulting to straight line`);
    }
    
    // Create temporary edge to calculate proper boundary intersection
    const tempEdge = new (EdgeClass ?? LineEdge)({
      data: {
        id: id + '_temp',
        source: sourcePoint,
        target: targetPoint,
        x: 0,
        y: 0,
      } as any,
      style: {},
      registry: this._registry,
    });
    
    // Calculate boundary-adjusted points using edge's direction calculation
    const adjustedPoints = this.calculateBoundaryPointsForEdge(
      tempEdge,
      sourceNode,
      targetNode,
      sourcePoint,
      targetPoint
    );
    
    // Clean up temp edge
    tempEdge.destroy();
    
    // Create edge shape data with adjusted points AND centers for tangent calculation
    const edgeShapeData: RendererEdge = {
      id,
      source: adjustedPoints.source,      // Boundary points
      target: adjustedPoints.target,      // Boundary points  
      sourceCenter: sourcePoint,          // Node centers for tangent calculation
      targetCenter: targetPoint,          // Node centers for tangent calculation
      x: sourcePoint.x,                   // Position at source center
      y: sourcePoint.y,                   // Position at source center
      pathType,
      curvature,
      sourceDirection,
      targetDirection,
      arrowSource,
      arrowTarget,
      arrowSize,
      label,
      payload,
    } as RendererEdge;
    
    console.log(`[Renderer] Creating edge ${id}:`, {
      sourceNode: sourceNode ? { id: source, x: sourceNode.x, y: sourceNode.y } : null,
      targetNode: targetNode ? { id: target, x: targetNode.x, y: targetNode.y } : null,
      sourcePoint, 
      targetPoint,
      boundary: adjustedPoints,
      edgeData: edgeShapeData
    });
    
    // Resolve edge styles with function-based property evaluation
    const mergedStyle = resolveEdgeStyle(
      edgeShapeData,
      this._defaultEdgeStyle,
      this._userEdgeStyle,
      style as Partial<FunctionBasedEdgeStyle>
    );
    
    // Create the actual edge
    const edge = new (EdgeClass ?? LineEdge)({
      data: edgeShapeData,
      style: mergedStyle,
      states,
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
  updateEdge(id: string, updates: Partial<CanvasEdge>): RendererEdgeBase | undefined {
    const tracking = this._edges.get(id);
    if (!tracking) return undefined;
    
    const { edge } = tracking;
    
    // Update style
    if (updates.style) {
      edge.updateEdgeStyle(updates.style);
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
      
      edge.updateEndpoints(adjustedPoints.source, adjustedPoints.target, sourcePoint, targetPoint);
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
  getEdge(id: string): RendererEdgeBase | undefined {
    return this._edges.get(id)?.edge;
  }

  /**
   * Get all edges
   */
  getEdges(): RendererEdgeBase[] {
    return Array.from(this._edges.values()).map(t => t.edge);
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): RendererEdgeBase[] {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds) return [];
    
    return Array.from(edgeIds)
      .map(id => this._edges.get(id)?.edge)
      .filter((e): e is RendererEdgeBase => e !== undefined);
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
  addNodes(inputs: CanvasNode[]): RendererNodeBase[] {
    return inputs.map(input => this.addNode(input));
  }

  /**
   * Add multiple edges at once
   */
  addEdges(inputs: CanvasEdge[]): RendererEdgeBase[] {
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
      node.setState(NodeStates.SELECTED, true);
    }
  }

  /**
   * Deselect a node
   */
  deselectNode(id: string): void {
    const node = this._nodes.get(id);
    if (node) {
      node.setState(NodeStates.SELECTED, false);
    }
  }

  /**
   * Select an edge
   */
  selectEdge(id: string): void {
    const tracking = this._edges.get(id);
    if (tracking) {
      tracking.edge.setState(EdgeStates.SELECTED, true);
    }
  }

  /**
   * Deselect an edge
   */
  deselectEdge(id: string): void {
    const tracking = this._edges.get(id);
    if (tracking) {
      tracking.edge.setState(EdgeStates.SELECTED, false);
    }
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    for (const node of this._nodes.values()) {
      node.setState(NodeStates.SELECTED, false);
    }
    for (const tracking of this._edges.values()) {
      tracking.edge.setState(EdgeStates.SELECTED, false);
    }
  }

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  /**
   * Set up drag handling for a node
   */
  private setupNodeDragHandling(node: RendererNodeBase): void {
    node.on('drag', this.handleNodeDragEvent, this);
  }

  /**
   * Handle node drag event
   */
  private handleNodeDragEvent(event: { node: RendererNodeBase; x: number; y: number }): void {
    this.updateConnectedEdges(event.node.id, event.x, event.y);
  }

  /**
   * Update all edges connected to a node when it moves
   */
  private updateConnectedEdges(nodeId: string, _x: number, _y: number): void {
    const edgeIds = this._nodeEdges.get(nodeId);
    if (!edgeIds || edgeIds.size === 0) return;
    
    console.log(`[updateConnectedEdges] Node ${nodeId} moved to (${_x}, ${_y}), updating ${edgeIds.size} edges`);
    
    for (const edgeId of edgeIds) {
      const tracking = this._edges.get(edgeId);
      if (!tracking) continue;
      
      const { edge, sourceNodeId, targetNodeId } = tracking;
      const isSource = sourceNodeId === nodeId;
      const isTarget = targetNodeId === nodeId;
      
      if (!isSource && !isTarget) continue;
      
      // Get source and target nodes
      const sourceNode = sourceNodeId ? this._nodes.get(sourceNodeId) : null;
      const targetNode = targetNodeId ? this._nodes.get(targetNodeId) : null;
      
      // Use node centers directly
      const sourceCenter = sourceNode 
        ? { x: sourceNode.x, y: sourceNode.y }
        : tracking.sourcePoint!;
      
      const targetCenter = targetNode
        ? { x: targetNode.x, y: targetNode.y }
        : tracking.targetPoint!;
      
      console.log(`[updateConnectedEdges] Edge ${edgeId}:`, {
        sourceNodeId, targetNodeId,
        sourceCenter, targetCenter,
        sourceNode: sourceNode ? { x: sourceNode.x, y: sourceNode.y } : null,
        targetNode: targetNode ? { x: targetNode.x, y: targetNode.y } : null
      });
        
      // Recalculate boundary points using edge's own direction calculation
      const adjustedPoints = this.calculateBoundaryPointsForEdge(
        edge,
        sourceNode ?? null,
        targetNode ?? null,
        sourceCenter,
        targetCenter
      );
      
      console.log(`[updateConnectedEdges] Edge ${edgeId} adjusted points:`, adjustedPoints);
      
      edge.updateEndpoints(adjustedPoints.source, adjustedPoints.target, sourceCenter, targetCenter);
    }
  }

  /**
   * Resolve an edge endpoint (node ID or point) to actual point and node reference
   */
  private resolveEdgeEndpoint(endpoint: string | Point): {
    point: Point;
    nodeId?: string;
    node: RendererNodeBase | null;
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
    sourceNode: RendererNodeBase | null,
    targetNode: RendererNodeBase | null,
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

  /**
   * Calculate boundary points using edge's specific direction calculation
   * This ensures bezier and orthogonal edges connect at the correct angle
   */
  private calculateBoundaryPointsForEdge(
    edge: RendererEdgeBase,
    sourceNode: RendererNodeBase | null,
    targetNode: RendererNodeBase | null,
    sourceCenter: Point,
    targetCenter: Point
  ): { source: Point; target: Point } {
    let source = sourceCenter;
    let target = targetCenter;
    
    // Calculate boundary points by passing target centers (not direction vectors)
    // getBoundaryPoint expects a world coordinate to calculate the angle from
    if (sourceNode) {
      console.log(`[Boundary] Edge ${edge.id} calculating source boundary from`, sourceCenter, 'towards', targetCenter);
      source = sourceNode.getBoundaryPoint(targetCenter, this._edgeBoundaryOffset);
      console.log(`[Boundary] Edge ${edge.id} source boundary point:`, source);
    }
    
    if (targetNode) {
      console.log(`[Boundary] Edge ${edge.id} calculating target boundary from`, targetCenter, 'towards', sourceCenter);
      target = targetNode.getBoundaryPoint(sourceCenter, this._edgeBoundaryOffset);
      console.log(`[Boundary] Edge ${edge.id} target boundary point:`, target);
    }
    
    return { source, target };
  }

  // =========================================================================
  // STYLE UPDATES
  // =========================================================================

  /**
   * Update user-defined node styles
   * Used when changing themes or global style configurations
   */
  setUserNodeStyle(style: Partial<FunctionBasedNodeStyle>): void {
    this._userNodeStyle = style;
  }

  /**
   * Update user-defined edge styles
   * Used when changing themes or global style configurations
   */
  setUserEdgeStyle(style: Partial<FunctionBasedEdgeStyle>): void {
    this._userEdgeStyle = style;
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
