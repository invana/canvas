# @aspect-ui/canvas-core

High-performance WebGPU-first canvas rendering engine for graph visualization.

## Features

- 🚀 **WebGPU-first** with automatic WebGL2 fallback
- 🎨 **Theming system** with light/dark modes and auto-coloring by type
- 🔌 **Plugin architecture** for extensibility
- 📐 **Multiple node shapes** - circle, rectangle, triangle, hexagon, and more
- ➡️ **Multiple edge types** - straight, bezier, orthogonal
- 🖱️ **Rich interactions** - pan, zoom, drag, select, hover
- ⚡ **State-based styling** - default, hovered, selected, highlighted, muted
- 🎬 **Built-in animations** - pulse, breathe, shake, bounce, and more
- 📦 **Tree-shakeable** ESM package

## Installation

```bash
pnpm add @aspect-ui/canvas-core
```

## Quick Start

```typescript
import { Canvas } from '@aspect-ui/canvas-core';

// Create canvas
const canvas = new Canvas('#container', {
  theme: 'light',
  autoResize: true,
});

// Initialize (async - sets up WebGPU/WebGL renderer)
await canvas.initialize();

// Add nodes
canvas.addNode({
  id: 'node-1',
  x: 0,
  y: 0,
  style: {
    shape: 'circle',
    fill: '#4CAF50',
  },
});

canvas.addNode({
  id: 'node-2',
  x: 200,
  y: 100,
  style: {
    shape: 'hexagon',
    fill: '#2196F3',
  },
});

// Add edge
canvas.addEdge({
  id: 'edge-1',
  source: 'node-1',
  target: 'node-2',
  style: {
    type: 'bezier',
  },
});

// Fit to content
canvas.fitToContent();
```

## API

### Canvas

Main entry point for the rendering engine.

```typescript
const canvas = new Canvas(container, options);
await canvas.initialize();
```

#### Options

- `theme` - 'light' | 'dark' | Theme object
- `autoResize` - Automatically resize with container
- `renderer` - Renderer configuration
- `viewport` - Viewport configuration
- `interactions` - Interaction configuration
- `data` - Initial graph data

#### Methods

**Data**
- `import(data)` - Import graph data
- `export()` - Export graph data
- `clear()` - Clear all data

**Nodes**
- `addNode(data)` - Add a node
- `updateNode(id, updates)` - Update a node
- `removeNode(id)` - Remove a node
- `getNode(id)` - Get node data
- `getNodes()` - Get all nodes

**Edges**
- `addEdge(data)` - Add an edge
- `updateEdge(id, updates)` - Update an edge
- `removeEdge(id)` - Remove an edge
- `getEdge(id)` - Get edge data
- `getEdges()` - Get all edges

**Viewport**
- `panTo(x, y)` - Pan to position
- `panBy(dx, dy)` - Pan by delta
- `zoomTo(zoom, center?)` - Zoom to level
- `zoomIn(center?)` - Zoom in
- `zoomOut(center?)` - Zoom out
- `fitToContent(padding?)` - Fit all content
- `resetView()` - Reset to default view

**Selection**
- `selectNode(id, additive?)` - Select a node
- `selectNodes(ids, additive?)` - Select multiple nodes
- `selectEdge(id, additive?)` - Select an edge
- `clearSelection()` - Clear selection
- `getSelectedNodes()` - Get selected nodes
- `getSelectedEdges()` - Get selected edges

**States**
- `setNodeState(id, state, value)` - Set node state
- `setEdgeState(id, state, value)` - Set edge state
- `highlightNodes(ids)` - Highlight specific nodes
- `clearHighlights()` - Clear all highlights

**Events**
- `on(event, handler)` - Subscribe to event
- `once(event, handler)` - Subscribe once
- `off(event, handler)` - Unsubscribe

**Theme**
- `setTheme(theme)` - Change theme
- `theme.registerNodeType(type, style)` - Register node type style
- `theme.registerEdgeType(type, style)` - Register edge type style

**Plugins**
- `use(plugin)` - Install a plugin
- `plugins.get(id)` - Get a plugin
- `plugins.enable(id)` - Enable a plugin
- `plugins.disable(id)` - Disable a plugin

### Node Shapes

Available node shapes:
- `circle` - Default circular node
- `ellipse` - Elliptical node
- `rectangle` - Rectangular node
- `roundedRectangle` - Rounded rectangle
- `square` - Square node
- `triangle` - Triangular node
- `diamond` - Diamond/rhombus node
- `pentagon` - Pentagon node
- `hexagon` - Hexagon node
- `octagon` - Octagon node
- `star` - Star node

### Edge Types

Available edge types:
- `straight` - Direct line
- `bezier` - Cubic bezier curve
- `quadratic` - Quadratic curve
- `orthogonal` - Right-angle path

### Events

Node events:
- `node:added`, `node:removed`, `node:updated`
- `node:hover`, `node:hoverEnd`
- `node:click`, `node:doubleClick`
- `node:dragStart`, `node:drag`, `node:dragEnd`
- `node:contextMenu`

Edge events:
- `edge:added`, `edge:removed`, `edge:updated`
- `edge:hover`, `edge:hoverEnd`
- `edge:click`, `edge:doubleClick`
- `edge:contextMenu`

Canvas events:
- `canvas:initialized`, `canvas:destroyed`, `canvas:resized`
- `canvas:click`, `canvas:doubleClick`, `canvas:contextMenu`
- `viewport:changed`
- `selection:changed`
- `theme:changed`

## License

MIT
