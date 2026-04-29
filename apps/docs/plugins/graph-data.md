# GraphDataPlugin

A graph data management plugin that exposes a data-centric API for rendering nodes and edges. Work with plain `INodeData` / `IEdgeData` objects — full state management, viewport culling, LOD, animations, and a clean event system included.

> **Package:** `@invana/plugins-graph-data`

## Installation

```bash
npm install @invana/plugins-graph-data
# or
pnpm add @invana/plugins-graph-data
```

## Setup

```ts
import { GraphDataPlugin } from '@invana/plugins-graph-data';

const graph = new GraphDataPlugin({ fitOnRender: true });
await canvas.plugins.register(graph);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'graph-data'` | Plugin id |
| `fitOnRender` | `boolean` | `false` | Fit camera after `setData()` |
| `fitPadding` | `number` | `40` | World-space padding used when fitting |

## Loading data

### `setData(data)`

Replace the entire graph. Clears existing nodes/edges then renders the new dataset.

```ts
graph.setData({
  nodes: [
    { id: 'n1', x: 0,   y: 0,   shape: 'circle', size: 40, label: 'A' },
    { id: 'n2', x: 200, y: 0,   shape: 'rect',   size: 50, label: 'B' },
    { id: 'n3', x: 100, y: 150, shape: 'hexagon', size: 44, label: 'C' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
    { id: 'e2', source: 'n2', target: 'n3', pathType: 'straight' },
  ],
});
```

### Node shape types

`'circle'` · `'rect'` · `'ellipse'` · `'polygon'` · `'diamond'` · `'star'` · `'hexagon'`

### Edge path types

`'straight'` · `'bezier'` · `'orthogonal'` · `'quadratic'` · `'rounded'` · `'smooth'`

## Style overrides

`setStyles` applies global style rules to all nodes/edges. Accepts static values or per-item functions.

```ts
graph.setStyles({
  node: {
    fill:        (node) => node.data?.color ?? '#3fcbeb',
    stroke:      '#ffffff',
    strokeWidth: 2,
  },
  edge: {
    stroke:      '#58a6ff',
    strokeWidth: 1.5,
  },
});
```

## Node CRUD

```ts
graph.addNode({ id: 'n4', x: 300, y: 0, shape: 'star', size: 40 });
graph.updateNode('n4', { x: 350, label: 'Updated' });
graph.removeNode('n4'); // also removes connected edges
const data = graph.getNodeData('n1');
```

## Edge CRUD

```ts
graph.addEdge({ id: 'e3', source: 'n1', target: 'n3', pathType: 'bezier' });
graph.updateEdge('e3', { pathType: 'orthogonal' });
graph.removeEdge('e3');
const data = graph.getEdgeData('e1');
```

## States

```ts
graph.addState('n1', 'selected');
graph.removeState('n1', 'selected');
const active = graph.getStates('n1'); // string[]
```

## Animations

```ts
graph.animate('n1', { pulse: { color: '#ff0000' } });
graph.clearAnimation('n1', 'pulse');
graph.clearAnimation('n1'); // clear all
```

## Viewport

```ts
graph.fitContent();        // use configured fitPadding
graph.fitContent(80);      // override padding
```

## Layout plugin contract

Layout plugins (e.g. `@invana/plugin-layouts-d3-force`) receive the node store and mutate `x`/`y` in place, then call `updateNodePositions`:

```ts
// layout plugin internal pattern
const store = graph.getNodeStore(); // Map<string, INodeData>
// mutate store entries x/y …
graph.updateNodePositions(positions); // Map<string, { x, y }>
```

## Custom types

```ts
import { BaseNode, BaseEdge } from '@invana/plugins-graph-data';

class DatabaseNode extends BaseNode {
  draw(ctx) { /* … */ }
}

graph.registerNode('database', DatabaseNode);
graph.registerEdge('dashed', MyDashedEdge);
graph.registerRouter('tree', myTreeRouterFn);
graph.registerMarker('arrow-hollow', myMarkerFn);
```

## Events

Events are emitted on the shared `canvas.events` bus:

```ts
canvas.events.on('graph:click', ({ elementId, elementType, worldX, worldY }) => {
  console.log(elementType, elementId);
});
canvas.events.on('graph:dragmove', ({ elementId, worldX, worldY }) => { /* … */ });
canvas.events.on('graph:added',   ({ elementId, elementType }) => { /* … */ });
canvas.events.on('graph:removed', ({ elementId, elementType }) => { /* … */ });
```

See [Events](/guide/events) for the full event type list.
