/**
 * SceneGraph - Simple element registry for rendered shapes
 * 
 * This is NOT a data store - it's a lightweight registry that tracks
 * rendered elements on the canvas. The actual graph data should be
 * managed by the consuming application.
 * 
 * Responsibilities:
 * - Track rendered node and edge instances
 * - Provide lookup by ID
 * - Emit events when elements are added/removed
 * - Query relationships (edges connected to a node)
 * - Spatial indexing for fast proximity queries
 */

// Type aliases for scene graph
type RendererNode = any;
type RendererEdge = any;
import { SpatialIndex, type Bounds } from './SpatialIndex';

export type SceneGraphEventType = 
  | 'nodeAdded'
  | 'nodeRemoved'
  | 'edgeAdded'
  | 'edgeRemoved'
  | 'cleared';

export type SceneGraphEventCallback = (event: {
  type: SceneGraphEventType;
  id: string;
}) => void;

/**
 * Internal node entry
 */
interface NodeEntry {
  id: string;
  data: RendererNode;
}

/**
 * Internal edge entry
 */
interface EdgeEntry {
  id: string;
  source: string;
  target: string;
  data: RendererEdge;
}

export class SceneGraph {
  private readonly nodes: Map<string, NodeEntry> = new Map();
  private readonly edges: Map<string, EdgeEntry> = new Map();
  private readonly nodeEdges: Map<string, Set<string>> = new Map(); // nodeId -> edgeIds
  private readonly listeners: Map<SceneGraphEventType, Set<SceneGraphEventCallback>> = new Map();
  private readonly spatialIndex: SpatialIndex = new SpatialIndex();

  // ===========================================================================
  // Event System
  // ===========================================================================

  on(event: SceneGraphEventType, callback: SceneGraphEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  off(event: SceneGraphEventType, callback: SceneGraphEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(type: SceneGraphEventType, id: string): void {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      for (const callback of callbacks) {
        callback({ type, id });
      }
    }
  }

  // ===========================================================================
  // Node Operations
  // ===========================================================================

  /**
   * Register a node in the scene
   */
  addNode(data: RendererNode): void {
    if (this.nodes.has(data.id)) {
      console.warn(`Node "${data.id}" already exists in scene`);
      return;
    }
    
    this.nodes.set(data.id, { id: data.id, data });
    this.nodeEdges.set(data.id, new Set());
    this.spatialIndex.insert(data);
    this.emit('nodeAdded', data.id);
  }
  /**
   * Remove a node from the scene
   */
  removeNode(id: string): void {
    if (!this.nodes.has(id)) return;
    
    this.nodes.delete(id);
    this.nodeEdges.delete(id);
    this.spatialIndex.remove(id);
    this.emit('nodeRemoved', id);
  }

  /**
   * Get a node's data
   */
  getNode(id: string): RendererNode | undefined {
    return this.nodes.get(id)?.data;
  }

  /**
   * Check if a node exists
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Get all node IDs
   */
  getNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get node count
   */
  get nodeCount(): number {
    return this.nodes.size;
  }

  // ===========================================================================
  // Edge Operations
  // ===========================================================================

  /**
   * Register an edge in the scene
   */
  addEdge(data: RendererEdge): void {
    if (this.edges.has(data.id)) {
      console.warn(`Edge "${data.id}" already exists in scene`);
      return;
    }

    this.edges.set(data.id, {
      id: data.id,
      source: data.source,
      target: data.target,
      data,
    });

    // Track edge connections
    this.nodeEdges.get(data.source)?.add(data.id);
    this.nodeEdges.get(data.target)?.add(data.id);
    
    this.emit('edgeAdded', data.id);
  }

  /**
   * Remove an edge from the scene
   */
  removeEdge(id: string): void {
    const edge = this.edges.get(id);
    if (!edge) return;

    // Remove from node connections
    this.nodeEdges.get(edge.source)?.delete(id);
    this.nodeEdges.get(edge.target)?.delete(id);
    
    this.edges.delete(id);
    this.emit('edgeRemoved', id);
  }

  /**
   * Get an edge's data
   */
  getEdge(id: string): RendererEdge | undefined {
    return this.edges.get(id)?.data;
  }

  /**
   * Check if an edge exists
   */
  hasEdge(id: string): boolean {
    return this.edges.has(id);
  }

  /**
   * Get all edge IDs
   */
  getEdgeIds(): string[] {
    return Array.from(this.edges.keys());
  }

  /**
   * Get edge count
   */
  get edgeCount(): number {
    return this.edges.size;
  }

  // ===========================================================================
  // Relationship Queries
  // ===========================================================================

  /**
   * Get edge IDs connected to a node
   */
  getNodeEdgeIds(nodeId: string): string[] {
    return Array.from(this.nodeEdges.get(nodeId) ?? []);
  }

  /**
   * Get edges connected to a node
   */
  getNodeEdges(nodeId: string): RendererEdge[] {
    const edgeIds = this.nodeEdges.get(nodeId);
    if (!edgeIds) return [];
    
    return Array.from(edgeIds)
      .map(id => this.edges.get(id)?.data)
      .filter((e): e is RendererEdge => e !== undefined);
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================
  // ===========================================================================
  // Spatial Queries
  // ===========================================================================

  /**
   * Query nodes within a rectangular bounds
   */
  queryNodesByBounds(bounds: Bounds): RendererNode[] {
    const nodeIds = this.spatialIndex.queryBounds(bounds);
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id)?.data)
      .filter((n): n is RendererNode => n !== undefined);
  }

  /**
   * Query nodes within a radius of a point
   */
  queryNodesByRadius(center: { x: number; y: number }, radius: number): RendererNode[] {
    const nodeIds = this.spatialIndex.queryRadius(center, radius);
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id)?.data)
      .filter((n): n is RendererNode => n !== undefined);
  }

  /**
   * Find nearest node to a point
   */
  findNearestNode(point: { x: number; y: number }, maxDistance?: number): RendererNode | null {
    const nodeId = this.spatialIndex.findNearest(point, maxDistance);
    return nodeId ? this.nodes.get(nodeId)?.data ?? null : null;
  }

  /**
   * Get internal node map (for QueryEngine)
   */
  getNodeMap(): Map<string, NodeEntry> {
    return this.nodes;
  }

  /**
   * Get internal edge map (for QueryEngine)
   */
  getEdgeMap(): Map<string, EdgeEntry> {
    return this.edges;
  }

  /**
   * Get node-edges relationship map (for Relationships)
   */
  getNodeEdgesMap(): Map<string, Set<string>> {
    return this.nodeEdges;
  }

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================

  /**
   * Clear all nodes and edges
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.nodeEdges.clear();
    this.spatialIndex.clear();
    this.emit('cleared', '');
  }

  /**
   * Destroy the scene graph
   */
  destroy(): void {
    this.clear();
    this.listeners.clear();
  }
}
