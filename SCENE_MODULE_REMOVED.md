# Scene Module - Removed

**Date Removed:** January 6, 2026  
**Reason:** Unused functionality - 1,047 lines of dead code  
**Total Lines Removed:** 1,047

## Overview

The scene module was a graph query and spatial indexing system that was never actually used in the codebase. While it provided sophisticated graph traversal and spatial query capabilities, none of these features were utilized by the Canvas, Renderer, or any plugins.

## What Was Removed

### 1. SceneGraph.ts (314 lines)
**Purpose:** Lightweight registry for tracking rendered nodes and edges

**Features:**
- Element registry with Maps for O(1) lookups
- Event system for add/remove notifications
- Node-edge relationship tracking
- Spatial indexing integration
- Bulk operations (clear, destroy)

**API:**
```typescript
class SceneGraph {
  // Node operations
  addNode(data: RendererNode): void
  removeNode(id: string): void
  getNode(id: string): RendererNode | undefined
  hasNode(id: string): boolean
  getNodeIds(): string[]
  
  // Edge operations
  addEdge(data: RendererEdge): void
  removeEdge(id: string): void
  getEdge(id: string): RendererEdge | undefined
  hasEdge(id: string): boolean
  getEdgeIds(): string[]
  
  // Relationships
  getNodeEdgeIds(nodeId: string): string[]
  getNodeEdges(nodeId: string): RendererEdge[]
  
  // Spatial queries
  queryNodesByBounds(bounds: Bounds): RendererNode[]
  queryNodesByRadius(center: Point, radius: number): RendererNode[]
  findNearestNode(point: Point, maxDistance?: number): RendererNode | null
  
  // Event system
  on(event: SceneGraphEventType, callback: SceneGraphEventCallback): () => void
  off(event: SceneGraphEventType, callback: SceneGraphEventCallback): void
  
  // Bulk
  clear(): void
  destroy(): void
}
```

### 2. QueryEngine.ts (225 lines)
**Purpose:** Advanced filtering and querying for nodes and edges

**Features:**
- Property-based filtering (id, type, properties)
- Spatial filtering (bounds, radius)
- Custom filter functions
- Result pagination and counting

**API:**
```typescript
class QueryEngine {
  static queryNodes(nodes: Map, filter: QueryFilter): QueryResult<RendererNode>
  static queryEdges(edges: Map, filter: QueryFilter): QueryResult<RendererEdge>
  static queryNodesByBounds(nodes: Map, bounds: Bounds): RendererNode[]
  static queryNodesByRadius(nodes: Map, center: Point, radius: number): RendererNode[]
}

interface QueryFilter {
  id?: string | string[]
  type?: string | string[]
  properties?: Record<string, any>
  bounds?: { x: number; y: number; width: number; height: number }
  near?: { x: number; y: number; radius: number }
  filter?: (element: any) => boolean
}
```

### 3. Relationships.ts (287 lines)
**Purpose:** Graph traversal and relationship queries

**Features:**
- Neighbor discovery (incoming/outgoing/both)
- Degree calculations (in-degree, out-degree)
- Path finding (BFS-based)
- Relationship analysis

**API:**
```typescript
class Relationships {
  static getNodeRelationships(
    nodeId: string,
    edges: Map,
    nodeEdges: Map
  ): RelationshipInfo
  
  static getNeighbors(
    nodeId: string,
    edges: Map,
    nodeEdges: Map,
    options?: { direction?: 'incoming' | 'outgoing' | 'both' }
  ): string[]
  
  static findPath(
    startId: string,
    endId: string,
    edges: Map,
    nodeEdges: Map,
    options?: { maxDepth?: number; direction?: 'incoming' | 'outgoing' | 'both' }
  ): PathResult
}

interface RelationshipInfo {
  neighbors: string[]
  incoming: string[]
  outgoing: string[]
  degree: number
  inDegree: number
  outDegree: number
}
```

### 4. SpatialIndex.ts (210 lines)
**Purpose:** Grid-based spatial indexing for fast proximity queries

**Features:**
- Configurable grid cell size
- Bounds-based queries
- Radius-based queries
- Nearest neighbor search
- O(1) insertion/removal

**API:**
```typescript
class SpatialIndex {
  constructor(options?: { cellSize?: number })
  
  insert(node: RendererNode): void
  remove(id: string): void
  queryBounds(bounds: Bounds): Set<string>
  queryRadius(center: Point, radius: number): Set<string>
  findNearest(point: Point, maxDistance?: number): string | null
  clear(): void
}
```

### 5. index.ts (11 lines)
Module barrel exports

## Why It Was Removed

### Evidence of Non-Usage

1. **Never Called in Codebase:**
   - `queryNodes()` - 0 usages
   - `queryEdges()` - 0 usages
   - `getNodeRelationships()` - 0 usages
   - `getNeighbors()` - 0 usages
   - `findPath()` - 0 usages
   - `canvas.scene` - 0 accesses

2. **Data Duplication:**
   - Scene stored node/edge data in its own Maps
   - Canvas already has `_nodeData` and `_edgeData` Maps (single source of truth)
   - Renderer doesn't need scene queries

3. **Populated But Never Read:**
   ```typescript
   // Canvas.ts - populated scene but never queried it
   this._scene.addNode({ id, x, y });
   this._scene.addEdge({ id, source, target });
   // ... but no canvas.queryNodes(), canvas.getNeighbors(), etc.
   ```

4. **Not Used in Plugins:**
   - DragElementPlugin - doesn't use scene
   - ClickSelectPlugin - doesn't use scene
   - HoverActivatePlugin - doesn't use scene
   - No plugin accessed scene queries

5. **Not Used in Storybook:**
   - 0 examples of scene queries
   - 0 examples of graph traversal
   - All examples work fine without it

## Replacement

The scene module functionality is replaced by:

1. **Data Storage:** Canvas `_nodeData` and `_edgeData` Maps
   ```typescript
   // Canvas.ts
   private _nodeData: Map<string, CanvasNode> = new Map();
   private _edgeData: Map<string, CanvasEdge> = new Map();
   ```

2. **Graph Queries:** Users should use their own graph libraries
   - If graph traversal is needed, use libraries like:
     - `graphology` - Full-featured graph library
     - `ngraph.graph` - Lightweight graph structure
     - Custom graph logic in application layer

3. **Spatial Queries:** Use Renderer's node/edge Maps
   ```typescript
   // Simple spatial queries on application data
   const nodesInBounds = Array.from(canvas._nodeData.values())
     .filter(node => 
       node.x >= bounds.x && node.x <= bounds.x + bounds.width &&
       node.y >= bounds.y && node.y <= bounds.y + bounds.height
     );
   ```

## Architecture Simplification

**Before:**
```
Canvas
├── _nodeData: Map (for style resolution)
├── _edgeData: Map (for style resolution)
└── _scene: SceneGraph
    ├── nodes: Map (duplicate data)
    ├── edges: Map (duplicate data)
    ├── nodeEdges: Map (relationships)
    └── spatialIndex: SpatialIndex
```

**After:**
```
Canvas
├── _nodeData: Map (single source of truth)
└── _edgeData: Map (single source of truth)
```

## Impact

- ✅ **Removed:** 1,047 lines of unused code
- ✅ **Eliminated:** Data duplication between Canvas and SceneGraph
- ✅ **Simplified:** Canvas architecture - one data storage location
- ✅ **Reduced:** Bundle size
- ✅ **No Breaking Changes:** Nobody was using these APIs

## Migration Guide

If you were using scene module APIs (unlikely, as nobody was), here's how to replace them:

### Query Nodes
```typescript
// Before
const result = canvas.queryNodes({ 
  properties: { type: 'person' } 
});

// After - use your own filtering
const nodes = Array.from(yourGraphData.nodes.values())
  .filter(node => node.type === 'person');
```

### Get Neighbors
```typescript
// Before
const neighbors = canvas.getNeighbors(nodeId);

// After - use your own graph structure
const neighbors = yourGraph.neighbors(nodeId);
// Or use graphology: graph.neighbors(nodeId)
```

### Find Path
```typescript
// Before
const path = canvas.findPath(startId, endId);

// After - use graph library
import { bidirectional } from 'graphology-shortest-path';
const path = bidirectional(yourGraph, startId, endId);
```

### Spatial Queries
```typescript
// Before
const nearby = canvas.queryNodesByBounds(bounds);

// After - simple filter on your data
const nearby = yourNodes.filter(node => 
  node.x >= bounds.x && 
  node.x <= bounds.x + bounds.width &&
  node.y >= bounds.y && 
  node.y <= bounds.y + bounds.height
);
```

## Lessons Learned

1. **YAGNI Principle:** You Ain't Gonna Need It - don't build features speculatively
2. **Data Duplication:** Avoid maintaining multiple copies of the same data
3. **Separation of Concerns:** Canvas is a rendering engine, not a graph database
4. **Export ≠ Usage:** Just because something is in the public API doesn't mean it's being used

## Future Consideration

If graph query functionality is needed in the future:
- Let users bring their own graph library
- Provide adapters/hooks if needed
- Don't duplicate user's graph data inside Canvas
- Keep Canvas focused on rendering, not data management
