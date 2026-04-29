# ShapesPlugin

Low-level rendering engine for shapes and connectors. Manages a shape pool, connector pool, viewport culling, LOD transitions, animations, and pointer interactions.

> **Package:** `@invana/plugins-shapes`

Use `ShapesPlugin` directly when you need fine-grained control over individual shapes and connectors. For a higher-level graph API, see [`GraphDataPlugin`](./graph-data.md) which builds on top of `ShapesPlugin`.

## Installation

```bash
npm install @invana/plugins-shapes
# or
pnpm add @invana/plugins-shapes
```

## Setup

```ts
import { ShapesPlugin } from '@invana/plugins-shapes';

const shapes = new ShapesPlugin();
await canvas.plugins.register(shapes);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'shapes'` | Plugin instance id |
| `zIndex` | `number` | `5` | Z-index of the connector layer. Shape layer = `zIndex + 1`, halo layer = `zIndex + 2` |
| `lod` | `Partial<LODThresholds>` | `{}` | Override LOD zoom thresholds |
| `animationRegistry` | `AnimationRegistry` | `defaultRegistry` | Custom animation registry |

## Adding shapes

```ts
shapes.addShape('circle', {
  id: 's1',
  x: 0, y: 0,
  radius: 30,
  style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
  label: 'A',
  interactive: true,
});

shapes.addShape('rect', {
  id: 's2',
  x: 100, y: 0,
  width: 60, height: 40,
  style: { fill: '#f58a07', cornerRadius: 6 },
});
```

### Built-in shape types

`'circle'` · `'rect'` · `'ellipse'` · `'polygon'` · `'diamond'` · `'star'` · `'hexagon'`

## Adding connectors

```ts
shapes.addConnector('bezier', {
  id: 'c1',
  from: { x: 30, y: 0 },
  to: { x: 170, y: 0 },
  style: { stroke: '#58a6ff', strokeWidth: 2 },
});
```

### Built-in connector types

`'straight'` · `'bezier'` · `'orthogonal'` · `'quadratic'` · `'rounded'` · `'smooth'`

## Shape / connector CRUD

```ts
// Update
shapes.updateShape('s1', { x: 50, fill: '#ff0000' });
shapes.updateConnector('c1', { to: { x: 200, y: 50 } });

// Remove
shapes.removeShape('s1');
shapes.removeConnector('c1');

// Get
const shapeObj = shapes.getShape('s1');
const connectorObj = shapes.getConnector('c1');

// Bulk replace
shapes.setData(
  [{ type: 'circle', spec: { id: 'a', x: 0, y: 0, radius: 20 } }],
  [{ type: 'straight', spec: { id: 'e1', from: { x: 0, y: 0 }, to: { x: 100, y: 0 } } }],
);
```

## States

```ts
shapes.setState('s1', 'selected', true);
shapes.clearState('s1', 'selected');
shapes.clearAllStates('s1');
const active = shapes.getStates('s1'); // string[]
```

## Animations

```ts
shapes.animate('s1', { pulse: { color: '#ff0000' } });
shapes.clearAnimation('s1', 'pulse');
shapes.clearAnimation('s1'); // clear all
```

### Built-in animation types

| Type | Options |
|---|---|
| `breathe` | `amplitude?: number` |
| `colorCycle` | `colors?: string[]`, `speed?: number` |
| `fadeIn` | `duration?: number` |
| `pulse` | `color?: string`, `speed?: number` |
| `marchingAnts` | `speed?: number` |
| `dashedFlow` | `speed?: number` |
| `borderGlow` | `color?: string`, `width?: number` |

## Geometry queries

```ts
const bbox = shapes.getBBox('s1');        // { minX, minY, maxX, maxY } | null
const center = shapes.getCenter('s1');    // { x, y } | null
const cp = shapes.getConnectionPoint('s1', 200, 200); // perimeter point toward (200, 200)
```

## Custom types

```ts
import { BaseShape, BaseConnector } from '@invana/plugins-shapes';

class DatabaseShape extends BaseShape {
  draw(ctx) { /* … */ }
}

shapes.registerShape('database', DatabaseShape);
shapes.registerConnector('dashed', MyDashedConnector);
shapes.registerRouter('tree', myTreeRouterFn);
shapes.registerMarker('arrow-hollow', myMarkerFn);
```

## Viewport

```ts
shapes.fitContent(60); // fit camera to all elements with 60px padding
shapes.clear();        // remove all shapes, connectors, and animations
```

## Events

Events are emitted on the shared `canvas.events` bus:

```ts
canvas.events.on('shape:click', ({ elementId, elementType, worldX, worldY }) => {
  console.log(elementType, elementId);
});
canvas.events.on('shape:dragmove', ({ elementId, worldX, worldY, dx, dy }) => { /* … */ });
canvas.events.on('shape:added', ({ elementId, elementType }) => { /* … */ });
canvas.events.on('shape:removed', ({ elementId, elementType }) => { /* … */ });
canvas.events.on('shape:statechange', ({ elementId, state, active }) => { /* … */ });
```

See [Events](/guide/events) for the full event type list.
