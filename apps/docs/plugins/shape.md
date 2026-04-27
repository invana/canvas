# ShapePlugin

A high-performance plugin for rendering large numbers of interactive, animated shapes. Each shape owns its own graphics object enabling viewport culling, LOD, dirty-flag redraws, and per-shape animations.

## Setup

```ts
import { ShapePlugin } from '@invana/canvas';

const shapes = new ShapePlugin({ fitOnRender: true });
await canvas.plugins.register(shapes);
```

## Constructor options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'shapes'` | Plugin id. Set when registering multiple instances. |
| `zIndex` | `number` | `10` | Z-index of the shapes layer |
| `fitOnRender` | `boolean` | `false` | Fit camera to all shapes after `setData()` |
| `fitPadding` | `number` | `60` | World-space padding used when fitting |
| `haloPoolSize` | `number` | `40` | Max simultaneous hover halos |
| `lod` | `Partial<LODThresholds>` | — | Override LOD zoom thresholds |

## Data API

### `setData(specs)`

Replace all shapes:

```ts
shapes.setData([
  { id: 'n1', type: 'circle', x: 0, y: 0, radius: 30,
    fill: { type: 'solid', color: '#3fcbeb' },
    border: { color: '#ffffff', width: 2 } },
  { id: 'n2', type: 'rect', x: 150, y: 0, width: 60, height: 40,
    fill: { type: 'solid', color: '#f58a07' } },
]);
```

### `add(spec)` / `remove(id)` / `update(id, partial)`

```ts
shapes.add({ id: 'n3', type: 'circle', x: 300, y: 0, radius: 20,
  fill: { type: 'solid', color: '#7c3aed' } });

shapes.update('n1', { fill: { type: 'solid', color: '#ff0000' } });

shapes.remove('n2');
```

### `clear()`

Remove all shapes and stop all animations.

### `fit(padding?)`

Fit the camera to the bounding box of all current shapes:

```ts
shapes.fit(50);
```

## Shape types

| Type | Required geometry fields |
|---|---|
| `'circle'` | `x`, `y`, `radius` |
| `'ellipse'` | `x`, `y`, `radiusX`, `radiusY` |
| `'rect'` | `x`, `y`, `width`, `height`, `cornerRadius?` |
| `'polygon'` | `x`, `y`, `radius`, `sides`, `rotation?` |
| `'star'` | `x`, `y`, `radius`, `points?`, `innerRatio?`, `rotation?` |

Dashed variants (`'dashed-circle'`, `'dashed-rect'`, `'dashed-line'`) share the same geometry fields.

Line types: `'line'`, `'bezier'`, `'orthogonal'`.

## Common shape fields

All shape types share these base fields:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique shape id |
| `fill` | `FillSpec` | Fill style |
| `border` | `BorderSpec` | Stroke style |
| `halo` | `HaloSpec` | Hover ring style |
| `animations` | `ShapeAnimations` | Active animations |
| `interactive` | `boolean` | Enable pointer events |
| `cursor` | `'pointer' \| 'grab' \| ...` | CSS cursor on hover |
| `draggable` | `boolean` | Enable drag events |
| `zIndex` | `number` | Layer z-order within the plugin |
| `data` | `Record<string, unknown>` | Arbitrary user data passed through event payloads |

## Fill styles

```ts
// Solid color
fill: { type: 'solid', color: '#3fcbeb' }

// Linear gradient
fill: { type: 'linear', stops: [{ color: '#3fcbeb', offset: 0 }, { color: '#0a2463', offset: 1 }] }

// Image / icon texture
fill: { type: 'texture', src: 'my-texture-key' }
fill: { type: 'icon', src: 'my-icon-key' }
```

Register textures before `setData()`:

```ts
await ShapePlugin.registerTexture('my-icon', '/icons/server.png');
```

## Animations

Start and stop animations at any time:

```ts
// Start one or more animations simultaneously
shapes.animate('n1', {
  breathe: { amplitude: 0.12, duration: 1667 },
  marchingAnts: { speed: 1.5 },
});

// Stop a specific animation (other animations keep running)
shapes.stopAnimation('n1', 'breathe');

// Stop all animations on a shape
shapes.stopAnimation('n1');
```

### Available animations

| Type | Options | Effect |
|---|---|---|
| `breathe` | `amplitude`, `duration` | Scale oscillation |
| `colorCycle` | `colors`, `duration` | Fill color cycling through a palette |
| `pulse` | `color`, `maxRadius`, `duration`, `rings` | Radiating ring pulse |
| `fadeIn` | `duration`, `from` | Opacity fade-in |
| `marchingAnts` | `speed`, `dashLength`, `gapLength` | Border dash march |
| `dashedFlow` | `speed`, `dashLength`, `gapLength` | Border dash flow |
| `borderGlow` | `color`, `minWidth`, `maxWidth`, `duration` | Border width glow pulse |

## Events

All shape events are emitted on `canvas.events`:

```ts
canvas.events.on('shape:click', ({ shapeId, worldX, worldY }) => {
  console.log('clicked shape', shapeId, 'at', worldX, worldY);
});

canvas.events.on('shape:dragstart', ({ shapeId }) => { /* ... */ });
canvas.events.on('shape:dragmove', ({ shapeId, worldX, worldY }) => { /* ... */ });
canvas.events.on('shape:dragend', ({ shapeId }) => { /* ... */ });
```

See [Events](/guide/events) for the full list of shape event types.
