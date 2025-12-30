/**
 * QueryEngine - Advanced queries for scene graph elements
 * 
 * Provides filtering, searching, and spatial queries
 */

// LEGACY: Old NodeData/EdgeData types removed, needs refactoring
type NodeData = any;
type EdgeData = any;

export interface QueryFilter {
  // Property-based filters
  id?: string | string[];
  type?: string | string[];
  properties?: Record<string, any>;
  
  // Spatial filters
  bounds?: { x: number; y: number; width: number; height: number };
  near?: { x: number; y: number; radius: number };
  
  // Custom filter function
  filter?: (element: NodeData | EdgeData) => boolean;
}

export interface QueryResult<T> {
  items: T[];
  count: number;
}

export class QueryEngine {
  /**
   * Query nodes with filters
   */
  static queryNodes(
    nodes: Map<string, { id: string; data: NodeData }>,
    filter: QueryFilter
  ): QueryResult<NodeData> {
    const results: NodeData[] = [];
    
    for (const entry of nodes.values()) {
      if (this.matchesFilter(entry.data, filter)) {
        results.push(entry.data);
      }
    }
    
    return {
      items: results,
      count: results.length,
    };
  }
  
  /**
   * Query edges with filters
   */
  static queryEdges(
    edges: Map<string, { id: string; source: string; target: string; data: EdgeData }>,
    filter: QueryFilter
  ): QueryResult<EdgeData> {
    const results: EdgeData[] = [];
    
    for (const entry of edges.values()) {
      if (this.matchesFilter(entry.data, filter)) {
        results.push(entry.data);
      }
    }
    
    return {
      items: results,
      count: results.length,
    };
  }
  
  /**
   * Find nodes within a rectangular bounds
   */
  static queryNodesByBounds(
    nodes: Map<string, { id: string; data: NodeData }>,
    bounds: { x: number; y: number; width: number; height: number }
  ): NodeData[] {
    const results: NodeData[] = [];
    
    for (const entry of nodes.values()) {
      const node = entry.data;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        results.push(node);
      }
    }
    
    return results;
  }
  
  /**
   * Find nodes within a radius of a point
   */
  static queryNodesByRadius(
    nodes: Map<string, { id: string; data: NodeData }>,
    center: { x: number; y: number },
    radius: number
  ): NodeData[] {
    const results: NodeData[] = [];
    const radiusSq = radius * radius;
    
    for (const entry of nodes.values()) {
      const node = entry.data;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dx = x - center.x;
      const dy = y - center.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= radiusSq) {
        results.push(node);
      }
    }
    
    return results;
  }
  
  /**
   * Find closest node to a point
   */
  static findClosestNode(
    nodes: Map<string, { id: string; data: NodeData }>,
    point: { x: number; y: number }
  ): NodeData | null {
    let closest: NodeData | null = null;
    let minDistSq = Infinity;
    
    for (const entry of nodes.values()) {
      const node = entry.data;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dx = x - point.x;
      const dy = y - point.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = node;
      }
    }
    
    return closest;
  }
  
  /**
   * Check if element matches filter
   */
  private static matchesFilter(
    element: NodeData | EdgeData,
    filter: QueryFilter
  ): boolean {
    // ID filter
    if (filter.id !== undefined) {
      const ids = Array.isArray(filter.id) ? filter.id : [filter.id];
      if (!ids.includes(element.id)) {
        return false;
      }
    }
    
    // Type filter
    if (filter.type !== undefined && 'shape' in element) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      if (!types.includes((element as any).shape || '')) {
        return false;
      }
    }
    
    // Properties filter
    if (filter.properties) {
      for (const [key, value] of Object.entries(filter.properties)) {
        if ((element as any)[key] !== value) {
          return false;
        }
      }
    }
    
    // Bounds filter (only for nodes)
    if (filter.bounds && 'x' in element && 'y' in element) {
      const node = element as NodeData;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      
      if (
        x < filter.bounds.x ||
        x > filter.bounds.x + filter.bounds.width ||
        y < filter.bounds.y ||
        y > filter.bounds.y + filter.bounds.height
      ) {
        return false;
      }
    }
    
    // Near filter (only for nodes)
    if (filter.near && 'x' in element && 'y' in element) {
      const node = element as NodeData;
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dx = x - filter.near.x;
      const dy = y - filter.near.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = filter.near.radius * filter.near.radius;
      
      if (distSq > radiusSq) {
        return false;
      }
    }
    
    // Custom filter function
    if (filter.filter && !filter.filter(element)) {
      return false;
    }
    
    return true;
  }
}
