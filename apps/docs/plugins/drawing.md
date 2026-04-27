# DrawingPlugin

A canvas plugin that exposes a fluent drawing API. All drawing commands operate on a single shared `PIXI.Graphics` instance. Use this for static diagrams, demos, and scenes that don't need the overhead of `ShapePlugin`'s per-shape culling and animations.

## Setup

```ts
import { DrawingPlugin } from '@invana/canvas';

const draw = new DrawingPlugin();
await canvas.plugins.register(draw);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'drawing'` | Plugin id. Set when registering multiple instances. |
| `zIndex` | `number` | `10` | Z-index of the drawing layer |

## Drawing shapes

All shape methods return `this` for fluent chaining.

```ts
draw
  .circle(0, 0, 40, { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 })
  .rect(100, -40, 80, 80, { fill: '#f58a07', cornerRadius: 8 })
  .ellipse(250, 0, 50, 30, { fill: '#7c3aed' })
  .polygon(370, 0, 40, 6, { fill: '#22c55e' })      // hexagon
  .polygon(470, 0, 40, 3, { fill: '#ef4444' })      // triangle
  .star(570, 0, 40, { fill: '#fbbf24', points: 5 });
```

### `circle(x, y, radius, style?)`

```ts
draw.circle(0, 0, 40, { fill: '#3fcbeb', stroke: '#fff', strokeWidth: 2, alpha: 1 });
```

### `rect(x, y, width, height, style?)`

```ts
draw.rect(50, 50, 120, 80, { fill: '#f58a07', cornerRadius: 10 });
```

### `ellipse(x, y, radiusX, radiusY, style?)`

```ts
draw.ellipse(200, 100, 60, 35, { fill: '#7c3aed' });
```

### `polygon(x, y, radius, sides, style?)`

```ts
draw.polygon(300, 100, 40, 6, { fill: '#22c55e', rotation: Math.PI / 6 });
```

### `star(x, y, radius, style?)`

```ts
draw.star(400, 100, 40, { fill: '#fbbf24', points: 5, innerRatio: 0.4 });
```

## Drawing paths

### `line(x1, y1, x2, y2, style?)`

```ts
draw.line(-100, 0, 100, 0, { stroke: '#58a6ff', strokeWidth: 2 });
```

### `bezier(from, cp1, to, style?, cp2?)`

```ts
draw.bezier(
  { x: -100, y: 0 },
  { x: -50, y: -80 },
  { x: 100, y: 0 },
  { stroke: '#58a6ff', strokeWidth: 2 },
);
```

### `autoBezier(from, to, style?, curvature?)`

Automatically computes control points from the start and end positions:

```ts
draw.autoBezier(
  { x: -100, y: 0 },
  { x: 100, y: 0 },
  { stroke: '#58a6ff', strokeWidth: 2 },
  80, // curvature offset (default: 80)
);
```

### `orthogonalPath(points, style?, params?)`

Right-angle routed path through a series of waypoints:

```ts
draw.orthogonalPath(
  [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 100 }],
  { stroke: '#58a6ff', strokeWidth: 2 },
);
```

## Dashed / dotted strokes

```ts
draw.dashedCircle(0, 0, 40, { stroke: '#fff', strokeWidth: 2, dashLength: 6, gapLength: 4 });
draw.dottedCircle(0, 0, 40, { stroke: '#fff', strokeWidth: 2, gapLength: 4 });
draw.dashedRect(50, 50, 80, 60, { stroke: '#fff', strokeWidth: 2 });
draw.dashedLine(-100, 0, 100, 0, { stroke: '#fff', strokeWidth: 2 });
```

## Arrows

```ts
draw.triangleArrow(100, 0, Math.PI, { fill: '#58a6ff', size: 12 });
draw.classicArrow(200, 0, 0, { stroke: '#58a6ff', strokeWidth: 2, size: 14 });
draw.diamondArrow(300, 0, Math.PI / 4, { fill: '#22c55e', size: 10 });
```

## Effects

```ts
// Circular glow ring around a node
draw.circleGlow(0, 0, 40, { color: '#3fcbeb', width: 8, alpha: 0.4 });

// Rectangular glow
draw.rectGlow(100, 100, 80, 60, { color: '#f58a07', width: 6, alpha: 0.3 });
```

## Custom shapes

Register project-level custom shape functions once at app startup:

```ts
DrawingPlugin.register('node:database', (g, x, y, size, color) => {
  // g is the raw PIXI.Graphics instance
  g.beginFill(color);
  g.drawEllipse(x, y - size * 0.6, size, size * 0.3);
  g.drawRect(x - size, y - size * 0.6, size * 2, size * 1.2);
  g.drawEllipse(x, y + size * 0.6, size, size * 0.3);
  g.endFill();
});

// Use in any DrawingPlugin instance
draw.shape('node:database', 0, 0, 40, '#3fcbeb');
```

## Clearing

```ts
draw.clear(); // erase all drawn content
```

## `DrawStyle` reference

```ts
interface DrawStyle {
  fill?: string | number;        // fill color
  stroke?: string | number;      // stroke color
  strokeWidth?: number;          // stroke width in pixels (default: 1)
  alpha?: number;                // opacity 0–1 (default: 1)
  cornerRadius?: number;         // rect corner radius
}
```

## `PathStyle` reference

```ts
interface PathStyle {
  stroke?: string | number;
  strokeWidth?: number;
  alpha?: number;
}
```
