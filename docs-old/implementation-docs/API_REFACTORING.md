# Canvas Background Pointer Events

## New Supported Events

The Canvas event system now emits the following events for pointer interactions on the background (viewport):

- `canvas:pointerdown`
- `canvas:pointermove`
- `canvas:pointerup`
- `canvas:pointerupoutside`
- `canvas:globalpointermove`

These events are only fired when the pointer event target is the viewport (background), not nodes or edges.

**Event payload:**

```
{
  position: {
    screen: { x, y },
    world: { x, y }
  },
  originalEvent: <Pixi FederatedPointerEvent>
}
```

## Usage Example

```typescript
canvas.on('canvas:pointerdown', (e) => {
  // e.position.screen, e.position.world, e.originalEvent
});
```

This enables plugins like brush-select to implement drag-to-select using only the Canvas event bus.
# API Refactoring: Flat Structure

## Summary

Successfully refactored the Canvas API from a nested structure to a flat, developer-friendly structure.

## Changes

### Before (Nested Structure)
```typescript
canvas.addNode({
  data: {
    id: 'node-1',
    x: 100,
    y: 100,
    shape: 'circle',
    label: 'My Node'
  },
  style: {
    fill: '#4a90d9',
    stroke: '#333'
  },
  interactive: true,
  draggable: true
});

canvas.addEdge({
  data: {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    pathType: 'bezier'
  },
  style: {
    stroke: '#666'
  }
});
```

### After (Flat Structure)
```typescript
canvas.addNode({
  id: 'node-1',
  x: 100,
  y: 100,
  shape: 'circle',
  label: 'My Node',
  style: {
    fill: '#4a90d9',
    stroke: '#333'
  },
  interactive: true,
  draggable: true,
  states: ['selected'], // NEW: Direct state activation
  payload: { myData: 'here' } // NEW: Explicit user data field
});

canvas.addEdge({
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  pathType: 'bezier',
  style: {
    stroke: '#666'
  },
  states: ['highlighted'], // NEW: Direct state activation
  payload: { myData: 'here' } // NEW: Explicit user data field
});
```

## New Features

### 1. Direct State Activation
Nodes and edges can now be created with initial states:
```typescript
canvas.addNode({
  id: 'n1',
  x: 100,
  y: 100,
  states: ['selected', 'highlighted']
});
```

### 2. Disabled/Muted Interaction Blocking
Nodes/edges with `disabled` or `muted` states automatically block all interactions:
- No hover effects
- No click events
- No drag behavior
- `eventMode` set to `'none'` in PixiJS
- Cursor set to `'default'`

```typescript
canvas.addNode({
  id: 'n1',
  x: 100,
  y: 100,
  states: ['disabled'] // Automatically non-interactive
});
```

### 3. Explicit Payload Field
User data is now stored in a dedicated `payload` field:
```typescript
const node = canvas.addNode({
  id: 'n1',
  x: 100,
  y: 100,
  payload: {
    userId: 123,
    metadata: { ... }
  }
});

// Access via node.data.payload
console.log(node.data.payload.userId);
```

## Type Definitions

### NodeInput
```typescript
interface NodeInput {
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
  
  // Behavior
  interactive?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  
  // Initial states
  states?: string[];
  
  // Badges
  badges?: NodeBadge[];
}
```

### EdgeInput
```typescript
interface EdgeInput {
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
```

## Updated Files

### Core Library
- `packages/canvas-core/src/rendering/Renderer.ts`
  - Replaced `NodeData` → `NodeInput` (flat structure)
  - Replaced `EdgeData` → `EdgeInput` (flat structure)
  - Updated `addNode()`, `addEdge()`, `updateNode()`, `updateEdge()` methods
  - Added missing type imports (NodeShapeType, NodeBadge, EdgePathType, ArrowType)
  
- `packages/canvas-core/src/core/Canvas.ts`
  - Updated type aliases to use new `NodeInput`/`EdgeInput`
  - Fixed `render()` method to use flat properties
  - Separated SceneNodeData/SceneEdgeData from render types
  
- `packages/canvas-core/src/rendering/index.ts`
  - Exported `NodeInput` and `EdgeInput` instead of old `NodeData`/`EdgeData`
  
- `packages/canvas-core/src/index.ts`
  - Updated exports to use `NodeInput`/`EdgeInput`

### State Management
- `packages/canvas-core/src/elements/nodes/NodeShapeBase.ts`
  - Added `states?: string[]` parameter to constructor
  - Added `isDisabled()` method
  - Added `updateInteractionMode()` method
  - Updated all interaction handlers to check `isDisabled()` first
  
- `packages/canvas-core/src/elements/edges/EdgeShapeBase.ts`
  - Same changes as NodeShapeBase

### Storybook
- Most story files already using flat structure (no changes needed)
- Working stories:
  - ShapeGallery.stories.ts ✅
  - StateExamples.stories.ts ✅
  - HaloEffect.stories.ts ✅
  - NodeShapes.stories.ts ✅
  - EdgeTypes.stories.ts ✅
  - And many more...

## Migration Guide

### For Existing Code

If you have existing code using the old nested structure, update it like this:

```typescript
// OLD
canvas.addNode({
  data: {
    id: 'n1',
    x: 100,
    y: 100
  },
  style: { fill: '#blue' }
});

// NEW
canvas.addNode({
  id: 'n1',
  x: 100,
  y: 100,
  style: { fill: '#blue' }
});
```

### For User Data

```typescript
// OLD (mixing user data with shape data)
canvas.addNode({
  data: {
    id: 'n1',
    x: 100,
    y: 100,
    userId: 123, // ❌ Mixed with shape properties
    metadata: {}
  }
});

// NEW (explicit payload field)
canvas.addNode({
  id: 'n1',
  x: 100,
  y: 100,
  payload: { // ✅ Separate field for user data
    userId: 123,
    metadata: {}
  }
});
```

## Benefits

1. **Simpler API**: No nested `data.data` confusion
2. **Type Safety**: Clear separation between user data (payload) and shape data
3. **Better DX**: More intuitive property access
4. **Direct State Control**: Set initial states on creation
5. **Automatic Disabled Handling**: Non-interactive elements handled automatically
6. **Cleaner Code**: Less nesting, easier to read

## Breaking Changes

- ⚠️ `NodeData` and `EdgeData` interfaces replaced with `NodeInput` and `EdgeInput`
- ⚠️ Properties moved from `data` object to top level
- ⚠️ User data now requires explicit `payload` field
- ℹ️ Internal `NodeShapeData` and `EdgeShapeData` remain unchanged for type safety

## Backward Compatibility

The internal shape data structures (`NodeShapeData`, `EdgeShapeData`) remain unchanged, so:
- Existing node/edge instances work without modification
- Only the input API has changed
- Type system prevents accidental misuse
