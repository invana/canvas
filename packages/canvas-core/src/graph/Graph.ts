/**
 * Internal Graph data structure
 * Manages nodes and edges with adjacency information
 */

import type { EdgeData, GraphData, NodeData } from '../types/index.js';

export class Graph<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> {
  private _nodes: Map<string, NodeData<N>> = new Map();
  private _edges: Map<string, EdgeData<E>> = new Map();

  // Adjacency lists
  private _outEdges: Map<string, Set<string>> = new Map();
  private _inEdges: Map<string, Set<string>> = new Map();

  constructor(data?: GraphData<N, E>) {
    if (data) {
      this.import(data);
    }
  }

  // ============================================================================
  // Node Operations
  // ============================================================================

  addNode(node: NodeData<N>): void {
    if (this._nodes.has(node.id)) {
      throw new Error(`Node with id "${node.id}" already exists`);
    }
    this._nodes.set(node.id, { ...node });
    this._outEdges.set(node.id, new Set());
    this._inEdges.set(node.id, new Set());
  }

  updateNode(id: string, updates: Partial<NodeData<N>>): void {
    const node = this._nodes.get(id);
    if (!node) {
      throw new Error(`Node with id "${id}" not found`);
    }
    this._nodes.set(id, { ...node, ...updates, id }); // Prevent id change
  }

  removeNode(id: string): void {
    if (!this._nodes.has(id)) {
      throw new Error(`Node with id "${id}" not found`);
    }

    // Remove all connected edges
    const outEdges = this._outEdges.get(id) ?? new Set();
    const inEdges = this._inEdges.get(id) ?? new Set();

    for (const edgeId of outEdges) {
      this.removeEdge(edgeId);
    }
    for (const edgeId of inEdges) {
      this.removeEdge(edgeId);
    }

    this._nodes.delete(id);
    this._outEdges.delete(id);
    this._inEdges.delete(id);
  }

  getNode(id: string): NodeData<N> | undefined {
    return this._nodes.get(id);
  }

  hasNode(id: string): boolean {
    return this._nodes.has(id);
  }

  get nodes(): NodeData<N>[] {
    return Array.from(this._nodes.values());
  }

  get nodeCount(): number {
    return this._nodes.size;
  }

  // ============================================================================
  // Edge Operations
  // ============================================================================

  addEdge(edge: EdgeData<E>): void {
    if (this._edges.has(edge.id)) {
      throw new Error(`Edge with id "${edge.id}" already exists`);
    }
    if (!this._nodes.has(edge.source)) {
      throw new Error(`Source node "${edge.source}" not found`);
    }
    if (!this._nodes.has(edge.target)) {
      throw new Error(`Target node "${edge.target}" not found`);
    }

    this._edges.set(edge.id, { ...edge });
    this._outEdges.get(edge.source)?.add(edge.id);
    this._inEdges.get(edge.target)?.add(edge.id);
  }

  updateEdge(id: string, updates: Partial<EdgeData<E>>): void {
    const edge = this._edges.get(id);
    if (!edge) {
      throw new Error(`Edge with id "${id}" not found`);
    }

    // If source/target changed, update adjacency
    if (updates.source && updates.source !== edge.source) {
      this._outEdges.get(edge.source)?.delete(id);
      this._outEdges.get(updates.source)?.add(id);
    }
    if (updates.target && updates.target !== edge.target) {
      this._inEdges.get(edge.target)?.delete(id);
      this._inEdges.get(updates.target)?.add(id);
    }

    this._edges.set(id, { ...edge, ...updates, id }); // Prevent id change
  }

  removeEdge(id: string): void {
    const edge = this._edges.get(id);
    if (!edge) {
      return; // Silently ignore - may have been removed as part of node removal
    }

    this._outEdges.get(edge.source)?.delete(id);
    this._inEdges.get(edge.target)?.delete(id);
    this._edges.delete(id);
  }

  getEdge(id: string): EdgeData<E> | undefined {
    return this._edges.get(id);
  }

  hasEdge(id: string): boolean {
    return this._edges.has(id);
  }

  get edges(): EdgeData<E>[] {
    return Array.from(this._edges.values());
  }

  get edgeCount(): number {
    return this._edges.size;
  }

  // ============================================================================
  // Adjacency Queries
  // ============================================================================

  getOutgoingEdges(nodeId: string): EdgeData<E>[] {
    const edgeIds = this._outEdges.get(nodeId);
    if (!edgeIds) return [];
    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((e): e is EdgeData<E> => e !== undefined);
  }

  getIncomingEdges(nodeId: string): EdgeData<E>[] {
    const edgeIds = this._inEdges.get(nodeId);
    if (!edgeIds) return [];
    return Array.from(edgeIds)
      .map((id) => this._edges.get(id))
      .filter((e): e is EdgeData<E> => e !== undefined);
  }

  getConnectedEdges(nodeId: string): EdgeData<E>[] {
    return [...this.getOutgoingEdges(nodeId), ...this.getIncomingEdges(nodeId)];
  }

  getNeighbors(nodeId: string): NodeData<N>[] {
    const neighbors = new Set<string>();

    for (const edge of this.getOutgoingEdges(nodeId)) {
      neighbors.add(edge.target);
    }
    for (const edge of this.getIncomingEdges(nodeId)) {
      neighbors.add(edge.source);
    }

    return Array.from(neighbors)
      .map((id) => this._nodes.get(id))
      .filter((n): n is NodeData<N> => n !== undefined);
  }

  getEdgeBetween(sourceId: string, targetId: string): EdgeData<E> | undefined {
    const outEdges = this._outEdges.get(sourceId);
    if (!outEdges) return undefined;

    for (const edgeId of outEdges) {
      const edge = this._edges.get(edgeId);
      if (edge?.target === targetId) {
        return edge;
      }
    }
    return undefined;
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  import(data: GraphData<N, E>): void {
    this.clear();

    for (const node of data.nodes) {
      this.addNode(node);
    }
    for (const edge of data.edges) {
      this.addEdge(edge);
    }
  }

  export(): GraphData<N, E> {
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }

  clear(): void {
    this._nodes.clear();
    this._edges.clear();
    this._outEdges.clear();
    this._inEdges.clear();
  }

  // ============================================================================
  // Iteration
  // ============================================================================

  forEachNode(callback: (node: NodeData<N>) => void): void {
    this._nodes.forEach(callback);
  }

  forEachEdge(callback: (edge: EdgeData<E>) => void): void {
    this._edges.forEach(callback);
  }

  // ============================================================================
  // Utility
  // ============================================================================

  clone(): Graph<N, E> {
    return new Graph(this.export());
  }
}
