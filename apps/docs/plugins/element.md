# ElementPlugin

A typed plugin for rendering solid shapes and path connectors with full state management, viewport culling, LOD, and a clean event system. It is designed as the long-term replacement for `ShapePlugin`.

Both plugins can coexist on the same canvas during migration.

## Setup

```ts
import { ElementPlugin } from '@invana/canvas';

const elements = new ElementPlugin({ fitOnRender: true });
await canvas.plugins.register(elements);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'elements'` | Plugin id. Set when registering multiple instances. |
| `zIndex` | `number` | `5` | Base z-index. Connectors get `zIndex`, solids get `zIndex + 1`. |
| `fitOnRender` | `boolean` | `false` | Fit camera after `setData()` / `addSolid()` |
| `fitPadding` | `number` | `60` | World-space padding used when fitting |
| `lod` | `Partial<LODThresholds>` | — | Override LOD zoom thresholds |

## Solid elements

### Built-in types

| Type | Required geometry | Extra options |
|---|---|---|
| `'circle'` | `x`, `y`, `radius` | — |
| `'rect'` | `x`, `y`, `width`, `height` | `cornerRadius?` |
| `'ellipse'` | `x`, `y`, `radiusX`, `radiusY` | — |
| `'polygon'` | `x`, `y`, `radius`, `sides` | `rotation?` |
| `'diamond'` | `x`, `y`, `width`, `height` | — |
| `'star'` | `x`, `y`, `radius` | `points?`, `innerRatio?`, `rotation?` |
| `'hexagon'` | `x`, `y`, `radius` | `rotation?` |

### `addSolid(type, spec)`

```ts
elements.addSolid('circle', {
  id: 'n1',
  x: 0,
  y: 0,
  radius: 30,
  style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
  label: 'Node 1',
  interactive: true,
  draggable: true,
});
```

### `updateSolid(id, partial)` / `removeSolid(id)` / `getSolid(id)`

```ts
elements.updateSolid('n1', { x: 100, y: 50 });
elements.removeSolid('n1');
const obj = elements.getSolid('n1');
```

## Connector elements

### Built-in types

| Type | Description |
|---|---|
| `'straight'` | Direct straight line |
| `'bezier'` | Cubic bezier curve |
| `'orthogonal'` | Right-angle routing |
| `'quadratic'` | Quadratic bezier curve |
| `'rounded'` | Rounded orthogonal corners |
| `'smooth'` | Smooth curve through waypoints |

### `addConnector(type, spec)`

Connect by explicit coordinates:

```ts
elements.addConnector('bezier', {
  id: 'e1',
  from: { x: 30, y: 0 },
  to:   { x: 170, y: 0 },
  style: { stroke: '#58a6ff', strokeWidth: 2 },
});
```

Connect by solid ids (endpoints resolved automatically):

```ts
elements.addConnector('straight', {
  id: 'e2',
  sourceId: 'n1',
  targetId: 'n2',
  style: { stroke: '#58a6ff', strokeWidth: 2 },
  startArrow: { type: 'none' },
  endArrow:   { type: 'triangle', size: 10 },
});
```

When `sourceId`/`targetId` are used, the connector automatically re-routes when the source or target solid is dragged.

### `updateConnector(id, partial)` / `removeConnector(id)` / `getConnector(id)`

```ts
elements.updateConnector('e1', { style: { stroke: '#ff4444' } });
elements.removeConnector('e1');
```

## Arrow markers

Available arrow types for `startArrow.type` / `endArrow.type`:

`'triangle'`, `'triangle-outline'`, `'diamond'`, `'diamond-outline'`, `'circle'`, `'circle-outline'`, `'circle-plus'`, `'square'`, `'square-outline'`, `'block'`, `'classic'`, `'ellipse'`, `'cross'`, `'async'`, `'none'`

```ts
endArrow: { type: 'classic', size: 12, color: '#58a6ff' }
```

## Routers

Built-in routers control how connectors are routed between endpoints:

| Router | Description |
|---|---|
| `'normal'` | Default — straight line routing |
| `'orth'` | Right-angle routing |
| `'one-side'` | Route on one side of the source |
| `'er'` | Entity-relationship style routing |

```ts
elements.addConnector('orthogonal', {
  id: 'e3',
  sourceId: 'n1',
  targetId: 'n2',
  router: 'orth',
});
```

## Registering custom types

```ts
import { BaseSolid } from '@invana/canvas';

class DatabaseNode extends BaseSolid {
  draw(ctx) { /* custom draw logic */ }
}

elements.registerElement('database', DatabaseNode);
elements.addSolid('database', { id: 'db1', x: 0, y: 0, width: 80, height: 60 });
```

Similarly for connectors (`registerConnector`), routers (`registerRouter`), and markers (`registerMarker`).

## States

```ts
elements.setState('n1', 'selected', true);
elements.setState('n1', 'selected', false);
```

State changes are reflected in the rendered style and emit `element:state-change` on the event bus.

## Fitting

```ts
elements.fit(50); // pad 50px around all elements
```

## Events

```ts
canvas.events.on('element:click', ({ elementId, elementType, worldX, worldY }) => {
  console.log(elementType, elementId, 'clicked at', worldX, worldY);
});

canvas.events.on('element:dragmove', ({ elementId, worldX, worldY }) => {
  // element being dragged to worldX, worldY
});

canvas.events.on('element:added', ({ elementId, elementType }) => { /* ... */ });
canvas.events.on('element:removed', ({ elementId, elementType }) => { /* ... */ });
```

See [Events](/guide/events) for the full list of element event types.
