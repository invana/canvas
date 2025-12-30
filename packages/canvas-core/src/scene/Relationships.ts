/**
 * Relationships - Graph relationship queries and traversal
 * 
 * Provides graph traversal, neighbor queries, and path finding
 */

// Type alias for relationships
type RendererEdge = any;

export interface RelationshipInfo {
  neighbors: string[]; // Connected node IDs
  incoming: string[]; // Edges pointing to this node
  outgoing: string[]; // Edges originating from this node
  degree: number; // Total number of connections
  inDegree: number; // Number of incoming edges
  outDegree: number; // Number of outgoing edges
}

export interface PathResult {
  found: boolean;
  path: string[]; // Node IDs in path
  length: number;
}

export class Relationships {
  /**
   * Get all relationships for a node
   */
  static getNodeRelationships(
    nodeId: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>
  ): RelationshipInfo {
    const edgeIds = nodeEdges.get(nodeId) || new Set<string>();
    const incoming: string[] = [];
    const outgoing: string[] = [];
    const neighbors = new Set<string>();
    
    for (const edgeId of edgeIds) {
      const edge = edges.get(edgeId);
      if (!edge) continue;
      
      if (edge.source === nodeId) {
        outgoing.push(edgeId);
        neighbors.add(edge.target);
      }
      
      if (edge.target === nodeId) {
        incoming.push(edgeId);
        neighbors.add(edge.source);
      }
    }
    
    return {
      neighbors: Array.from(neighbors),
      incoming,
      outgoing,
      degree: neighbors.size,
      inDegree: incoming.length,
      outDegree: outgoing.length,
    };
  }
  
  /**
   * Get direct neighbors of a node
   */
  static getNeighbors(
    nodeId: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>,
    options: {
      direction?: 'incoming' | 'outgoing' | 'both';
    } = {}
  ): string[] {
    const direction = options.direction || 'both';
    const edgeIds = nodeEdges.get(nodeId) || new Set<string>();
    const neighbors = new Set<string>();
    
    for (const edgeId of edgeIds) {
      const edge = edges.get(edgeId);
      if (!edge) continue;
      
      if (direction === 'outgoing' || direction === 'both') {
        if (edge.source === nodeId) {
          neighbors.add(edge.target);
        }
      }
      
      if (direction === 'incoming' || direction === 'both') {
        if (edge.target === nodeId) {
          neighbors.add(edge.source);
        }
      }
    }
    
    return Array.from(neighbors);
  }
  
  /**
   * Get edges connected to a node
   */
  static getConnectedEdges(
    nodeId: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>,
    options: {
      direction?: 'incoming' | 'outgoing' | 'both';
    } = {}
  ): RendererEdge[] {
    const direction = options.direction || 'both';
    const edgeIds = nodeEdges.get(nodeId) || new Set<string>();
    const result: RendererEdge[] = [];
    
    for (const edgeId of edgeIds) {
      const entry = edges.get(edgeId);
      if (!entry) continue;
      
      const isOutgoing = entry.source === nodeId;
      const isIncoming = entry.target === nodeId;
      
      if (
        direction === 'both' ||
        (direction === 'outgoing' && isOutgoing) ||
        (direction === 'incoming' && isIncoming)
      ) {
        result.push(entry.data);
      }
    }
    
    return result;
  }
  
  /**
   * Find shortest path between two nodes (BFS)
   */
  static findPath(
    startId: string,
    endId: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>,
    options: {
      directed?: boolean;
      maxDepth?: number;
    } = {}
  ): PathResult {
    const directed = options.directed ?? false;
    const maxDepth = options.maxDepth ?? Infinity;
    
    if (startId === endId) {
      return { found: true, path: [startId], length: 0 };
    }
    
    const visited = new Set<string>([startId]);
    const queue: Array<{ nodeId: string; path: string[]; depth: number }> = [
      { nodeId: startId, path: [startId], depth: 0 },
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.depth >= maxDepth) {
        continue;
      }
      
      const neighbors = this.getNeighbors(
        current.nodeId,
        edges,
        nodeEdges,
        { direction: directed ? 'outgoing' : 'both' }
      );
      
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) {
          continue;
        }
        
        const newPath = [...current.path, neighborId];
        
        if (neighborId === endId) {
          return {
            found: true,
            path: newPath,
            length: newPath.length - 1,
          };
        }
        
        visited.add(neighborId);
        queue.push({
          nodeId: neighborId,
          path: newPath,
          depth: current.depth + 1,
        });
      }
    }
    
    return { found: false, path: [], length: -1 };
  }
  
  /**
   * Get all nodes within N hops of a node
   */
  static getNodesWithinHops(
    nodeId: string,
    hops: number,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>,
    options: {
      direction?: 'incoming' | 'outgoing' | 'both';
      includeOrigin?: boolean;
    } = {}
  ): string[] {
    const direction = options.direction || 'both';
    const includeOrigin = options.includeOrigin ?? false;
    
    const visited = new Set<string>();
    const result: string[] = [];
    const queue: Array<{ nodeId: string; depth: number }> = [
      { nodeId, depth: 0 },
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.nodeId)) {
        continue;
      }
      
      visited.add(current.nodeId);
      
      if (current.depth > 0 || (current.depth === 0 && includeOrigin)) {
        result.push(current.nodeId);
      }
      
      if (current.depth < hops) {
        const neighbors = this.getNeighbors(
          current.nodeId,
          edges,
          nodeEdges,
          { direction }
        );
        
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            queue.push({
              nodeId: neighborId,
              depth: current.depth + 1,
            });
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if there's a path between two nodes
   */
  static isConnected(
    startId: string,
    endId: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>,
    options: {
      directed?: boolean;
    } = {}
  ): boolean {
    const result = this.findPath(startId, endId, edges, nodeEdges, options);
    return result.found;
  }
  
  /**
   * Get common neighbors between two nodes
   */
  static getCommonNeighbors(
    nodeId1: string,
    nodeId2: string,
    edges: Map<string, { id: string; source: string; target: string; data: RendererEdge }>,
    nodeEdges: Map<string, Set<string>>
  ): string[] {
    const neighbors1 = new Set(this.getNeighbors(nodeId1, edges, nodeEdges));
    const neighbors2 = new Set(this.getNeighbors(nodeId2, edges, nodeEdges));
    
    return Array.from(neighbors1).filter((n) => neighbors2.has(n));
  }
}
