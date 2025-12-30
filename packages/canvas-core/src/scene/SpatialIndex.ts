/**
 * SpatialIndex - Simple spatial indexing for fast spatial queries
 * 
 * Uses a basic grid-based spatial hash for efficient lookups.
 * For very large datasets, consider using R-tree or Quadtree.
 */

// LEGACY: Old NodeData type removed, needs refactoring
type NodeData = any;

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialIndexOptions {
  /** Grid cell size for spatial hashing */
  cellSize?: number;
}

/**
 * Simple grid-based spatial index for fast proximity queries
 */
export class SpatialIndex {
  private readonly cellSize: number;
  private readonly grid: Map<string, Set<string>> = new Map(); // cellKey -> nodeIds
  private readonly nodePositions: Map<string, { x: number; y: number }> = new Map();

  constructor(options: SpatialIndexOptions = {}) {
    this.cellSize = options.cellSize || 100;
  }

  /**
   * Insert or update a node in the spatial index
   */
  insert(node: NodeData): void {
    const x = node.x ?? 0;
    const y = node.y ?? 0;

    // Remove from old position if exists
    this.remove(node.id);

    // Add to new position
    const cellKey = this.getCellKey(x, y);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey)!.add(node.id);
    this.nodePositions.set(node.id, { x, y });
  }

  /**
   * Remove a node from the spatial index
   */
  remove(id: string): void {
    const pos = this.nodePositions.get(id);
    if (!pos) return;

    const cellKey = this.getCellKey(pos.x, pos.y);
    this.grid.get(cellKey)?.delete(id);
    this.nodePositions.delete(id);
  }

  /**
   * Query nodes within a rectangular bounds
   */
  queryBounds(bounds: Bounds): Set<string> {
    const result = new Set<string>();
    
    // Calculate cell range
    const minCellX = Math.floor(bounds.x / this.cellSize);
    const maxCellX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const minCellY = Math.floor(bounds.y / this.cellSize);
    const maxCellY = Math.floor((bounds.y + bounds.height) / this.cellSize);

    // Check all cells in range
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`;
        const nodes = this.grid.get(cellKey);
        if (nodes) {
          for (const nodeId of nodes) {
            const pos = this.nodePositions.get(nodeId);
            if (pos && this.isInBounds(pos, bounds)) {
              result.add(nodeId);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Query nodes within a radius of a point
   */
  queryRadius(center: { x: number; y: number }, radius: number): Set<string> {
    const result = new Set<string>();
    const radiusSquared = radius * radius;

    // Calculate cell range to check
    const minCellX = Math.floor((center.x - radius) / this.cellSize);
    const maxCellX = Math.floor((center.x + radius) / this.cellSize);
    const minCellY = Math.floor((center.y - radius) / this.cellSize);
    const maxCellY = Math.floor((center.y + radius) / this.cellSize);

    // Check all cells in range
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const cellKey = `${cellX},${cellY}`;
        const nodes = this.grid.get(cellKey);
        if (nodes) {
          for (const nodeId of nodes) {
            const pos = this.nodePositions.get(nodeId);
            if (pos) {
              const distSquared = (pos.x - center.x) ** 2 + (pos.y - center.y) ** 2;
              if (distSquared <= radiusSquared) {
                result.add(nodeId);
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Find nearest node to a point
   */
  findNearest(point: { x: number; y: number }, maxDistance?: number): string | null {
    let nearest: string | null = null;
    let minDistSquared = maxDistance ? maxDistance ** 2 : Infinity;

    // Start with cell containing point, then expand outward
    const startRadius = this.cellSize;
    const maxRadius = maxDistance || 1000;
    
    for (let radius = startRadius; radius <= maxRadius; radius += this.cellSize) {
      const candidates = this.queryRadius(point, radius);
      
      for (const nodeId of candidates) {
        const pos = this.nodePositions.get(nodeId);
        if (pos) {
          const distSquared = (pos.x - point.x) ** 2 + (pos.y - point.y) ** 2;
          if (distSquared < minDistSquared) {
            minDistSquared = distSquared;
            nearest = nodeId;
          }
        }
      }

      // If we found something, return it
      if (nearest) return nearest;
    }

    return nearest;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.grid.clear();
    this.nodePositions.clear();
  }

  /**
   * Get statistics about the index
   */
  getStats(): {
    totalNodes: number;
    totalCells: number;
    averageNodesPerCell: number;
  } {
    const totalNodes = this.nodePositions.size;
    const totalCells = this.grid.size;
    const averageNodesPerCell = totalCells > 0 ? totalNodes / totalCells : 0;

    return {
      totalNodes,
      totalCells,
      averageNodesPerCell,
    };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private isInBounds(pos: { x: number; y: number }, bounds: Bounds): boolean {
    return (
      pos.x >= bounds.x &&
      pos.x <= bounds.x + bounds.width &&
      pos.y >= bounds.y &&
      pos.y <= bounds.y + bounds.height
    );
  }
}
