# Centralized Defaults System

## Overview

All default styling, dimensions, and behavior for nodes and edges are now centralized in the `defaults/` directory. This provides a single source of truth for all default values, eliminating scattered hard-coded values throughout the codebase.

## Architecture

```
defaults/
├── index.ts        # Main exports
├── labels.ts       # Label styling defaults
├── nodes.ts        # Complete node configuration
└── edges.ts        # Complete edge configuration
```

## Node Defaults

### Available Configurations

#### 1. Dimensions (`DEFAULT_NODE_DIMENSIONS`)
```typescript
{
  width: 40,
  height: 40,
  minWidth: 10,
  minHeight: 10,
  maxWidth: 500,
  maxHeight: 500,
}
```

#### 2. Shape Style (`DEFAULT_NODE_SHAPE_STYLE`)
Base appearance for all nodes:
```typescript
{
  fill: 0x27c554,
  fillAlpha: 1,
  stroke: '#525252',
  strokeWidth: 5,
  strokeAlpha: 1,
  strokeStyle: 'solid',
  strokeAlignment: 0,
  strokeCap: 'round',
  halo: false,
  haloStrokeWidth: 10,
  haloStroke: '#127dc5',
  haloStrokeOpacity: 0.25,
}
```

#### 3. Label Configuration (`DEFAULT_NODE_LABEL`)
```typescript
{
  position: 'center',
  offsetX: 0,
  offsetY: 0,
  style: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: 12,
    fill: '#000000',
    // ... more label styles
  }
}
```

#### 4. Badge Configuration (`DEFAULT_NODE_BADGE`)
```typescript
{
  fontSize: 10,
  fontWeight: 'bold',
  fill: '#ffffff',
  background: 0xff4d4f,
  strokeWidth: 2,
  strokeColor: 0xffffff,
  padding: 4,
  borderRadius: 10,
}
```

#### 5. State Styles (`DEFAULT_NODE_STATE_STYLES`)
Per-state style overrides:
```typescript
{
  default: { /* base style */ },
  active: { strokeWidth: 5, strokeAlpha: 0.35, halo: true },
  selected: { strokeWidth: 5, strokeAlpha: 0.35, halo: true },
  highlighted: { stroke: '#98f45f', strokeWidth: 6 },
  disabled: { fill: 0xd9d9d9, stroke: '#bfbfbf' },
  muted: { strokeAlpha: 0.5, fillAlpha: 0.5 },
}
```

#### 6. Complete Node Style (`DEFAULT_NODE_STYLE`)
All configurations combined - use this as your base:
```typescript
import { DEFAULT_NODE_STYLE } from '@invana/canvas-core';

const node = new NodeShape({
  data: { id: 'node1', x: 100, y: 100 },
  style: DEFAULT_NODE_STYLE, // Use complete defaults
});
```

#### 7. Behavior Settings (`DEFAULT_NODE_BEHAVIOR`)
```typescript
{
  draggable: true,
  selectable: true,
  hoverable: true,
  clickable: true,
  cursor: 'pointer',
  cursorDragging: 'grabbing',
}
```

## Edge Defaults

### Available Configurations

#### 1. Path Style (`DEFAULT_EDGE_PATH_STYLE`)
```typescript
{
  stroke: '#8c8c8c',
  strokeWidth: 2,
  strokeAlpha: 1,
  strokeStyle: 'solid',
  strokeAlignment: 0.5,
  strokeCap: 'round',
  lineCap: 'round',
  lineJoin: 'round',
  visible: true,
  alpha: 1,
  cursor: 'pointer',
}
```

#### 2. Arrow Configuration (`DEFAULT_EDGE_ARROW`)
```typescript
{
  type: 'triangle',
  size: 10,
  fill: undefined,      // Uses edge stroke color
  stroke: undefined,
  sourceArrow: undefined,
  targetArrow: 'triangle',
}
```

#### 3. Routing Configuration (`DEFAULT_EDGE_ROUTING`)
```typescript
{
  cornerRadius: 8,
  controlPointDistance: 100,
  curvature: 0.5,
}
```

#### 4. Label Configuration (`DEFAULT_EDGE_LABEL`)
```typescript
{
  style: {
    fontSize: 10,
    fill: '#666666',
    // ... inherits from DEFAULT_LABEL_STYLE
  },
  position: 0.5,        // Middle of edge
  offset: { x: 0, y: -10 },
}
```

#### 5. State Styles (`DEFAULT_EDGE_STATE_STYLES`)
```typescript
{
  default: { /* base style */ },
  active: { stroke: '#91d5ff', strokeWidth: 4 },
  selected: { stroke: '#1890ff', strokeWidth: 4 },
  highlighted: { stroke: '#faad14', strokeWidth: 4 },
  muted: { strokeWidth: 1, strokeAlpha: 0.3 },
  disabled: { stroke: '#e8e8e8', strokeWidth: 1 },
}
```

#### 6. Stroke Presets (`EDGE_STROKE_PRESETS`)
Quick styling presets:
```typescript
{
  solid: { strokeStyle: 'solid' },
  dashed: { strokeStyle: 'dashed', strokeDashPattern: [10, 5] },
  dotted: { strokeStyle: 'dotted', strokeDashPattern: [2, 4] },
  dashedLong: { strokeDashPattern: [20, 10] },
  dashedDotted: { strokeDashPattern: [10, 5, 2, 5] },
}
```

## Label Defaults

### Available Configurations

#### 1. Base Label Style (`DEFAULT_LABEL_STYLE`)
```typescript
{
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 12,
  fontWeight: 'normal',
  fill: '#000000',
  stroke: undefined,
  strokeWidth: 0,
  letterSpacing: 0,
  lineHeight: 1.2,
  wordWrap: false,
  align: 'center',
}
```

#### 2. Label Variants (`LABEL_VARIANTS`)
Pre-configured label styles for different use cases:
```typescript
{
  node: { fontSize: 12, fontWeight: 'normal' },
  badge: { fontSize: 10, fontWeight: 'bold', fill: '#ffffff' },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 10, fill: '#666666' },
  edge: { fontSize: 10, fill: '#666666' },
}
```

## Usage Examples

### Example 1: Using Complete Defaults
```typescript
import { Canvas, DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE } from '@invana/canvas-core';

const canvas = new Canvas({
  container: document.getElementById('app')!,
});

// Create node with all defaults
const node = canvas.addNode({
  id: 'node1',
  x: 100,
  y: 100,
  style: DEFAULT_NODE_STYLE,
});

// Create edge with all defaults
const edge = canvas.addEdge({
  id: 'edge1',
  source: 'node1',
  target: 'node2',
  style: DEFAULT_EDGE_STYLE,
});
```

### Example 2: Customizing Specific Properties
```typescript
import { mergeNodeStyle, DEFAULT_NODE_STYLE } from '@invana/canvas-core';

// Override only what you need
const customStyle = mergeNodeStyle({
  fill: 0x1890ff,
  strokeWidth: 8,
  labelStyle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // All other properties inherit from defaults
});

const node = canvas.addNode({
  id: 'node1',
  x: 100,
  y: 100,
  style: customStyle,
});
```

### Example 3: Custom State Styling
```typescript
import { mergeNodeStateStyles } from '@invana/canvas-core';

const customStates = mergeNodeStateStyles({
  // Override selected state
  selected: {
    fill: 0xff4d4f,
    strokeWidth: 10,
  },
  // Add custom state
  loading: {
    fillAlpha: 0.5,
    strokeStyle: 'dashed',
  },
});

const node = canvas.addNode({
  id: 'node1',
  x: 100,
  y: 100,
  style: {
    states: customStates,
  },
});
```

### Example 4: Using Label Variants
```typescript
import { LABEL_VARIANTS } from '@invana/canvas-core';

// Use pre-configured label styles
const node = canvas.addNode({
  id: 'node1',
  x: 100,
  y: 100,
  label: 'Title Node',
  style: {
    labelStyle: LABEL_VARIANTS.title, // Large, bold text
  },
});
```

### Example 5: Using Edge Stroke Presets
```typescript
import { EDGE_STROKE_PRESETS } from '@invana/canvas-core';

const edge = canvas.addEdge({
  id: 'edge1',
  source: 'node1',
  target: 'node2',
  style: {
    ...EDGE_STROKE_PRESETS.dashed, // Quick dashed style
    stroke: '#1890ff',
  },
});
```

## Utility Functions

### `mergeNodeStyle(userStyle)`
Deeply merges user style with complete node defaults:
```typescript
const style = mergeNodeStyle({
  fill: 0x1890ff,
  // All other properties filled from defaults
});
```

### `mergeEdgeStyle(userStyle)`
Deeply merges user style with complete edge defaults:
```typescript
const style = mergeEdgeStyle({
  stroke: '#ff4d4f',
  strokeWidth: 4,
});
```

### `mergeNodeStateStyles(userStates)`
Merges custom state styles with default state styles:
```typescript
const states = mergeNodeStateStyles({
  selected: { strokeWidth: 12 }, // Override
  custom: { fill: 0xff0000 },    // Add new
});
```

### `mergeLabelStyle(userStyle)`
Merges user label style with default label style:
```typescript
const labelStyle = mergeLabelStyle({
  fontSize: 16,
  fontWeight: 'bold',
});
```

## Benefits

1. **Single Source of Truth**: All defaults in one place
2. **Type Safety**: Full TypeScript support with proper types
3. **Easy Customization**: Override only what you need
4. **Consistency**: Same defaults used everywhere
5. **Maintainability**: Change defaults in one place
6. **Documentation**: Clear, documented default values
7. **No Hard-coded Values**: All magic numbers eliminated

## Migration Guide

### Before
```typescript
// Hard-coded values scattered everywhere
const node = new NodeShape({
  style: {
    fill: 0x27c554,
    stroke: '#525252',
    strokeWidth: 5,
    labelStyle: { fill: '#000000', fontSize: 12 },
  }
});
```

### After
```typescript
// Use centralized defaults
import { DEFAULT_NODE_STYLE } from '@invana/canvas-core';

const node = new NodeShape({
  style: DEFAULT_NODE_STYLE,
});

// Or customize specific properties
import { mergeNodeStyle } from '@invana/canvas-core';

const node = new NodeShape({
  style: mergeNodeStyle({ fill: 0x1890ff }),
});
```

## Future Enhancements

Potential additions to the defaults system:
- Theme presets (dark mode, light mode, high contrast)
- Accessibility defaults (WCAG compliant colors)
- Animation defaults (duration, easing)
- Performance defaults (LOD thresholds, culling)
- Icon and badge defaults expansion
