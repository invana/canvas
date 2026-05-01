# MiniMapPlugin

Bird's-eye overview of the graph rendered as an absolutely-positioned overlay on the canvas's parent element. Clicking jumps the main camera; dragging the viewport indicator pans the camera continuously.

> **Package:** `@invana/plugins-graph-data`
>
> **Requires:** `GraphDataPlugin` registered first.

This plugin is **opt-in** — register it explicitly when a minimap is desired.

## Setup

```ts
import { GraphDataPlugin, MiniMapPlugin } from '@invana/plugins-graph-data';

await canvas.plugins.register(new GraphDataPlugin({ data }));

const minimap = new MiniMapPlugin({
  width:    200,
  height:   150,
  position: 'bottom-right',
});
await canvas.plugins.register(minimap);

// call after layout settles or data changes
minimap.refresh();
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'minimap'` | Plugin id override. |
| `graphDataId` | `string` | `'graph-data'` | Id of the `GraphDataPlugin` to read from. |
| `width` | `number` | `200` | Minimap width in pixels. |
| `height` | `number` | `150` | Minimap height in pixels. |
| `backgroundColor` | `number` | `0x1a1a2e` | Minimap background color as `0xRRGGBB`. |
| `viewportFill` | `number` | `0x4a90d9` | Viewport indicator fill color. |
| `viewportStroke` | `number` | `0x2a70b9` | Viewport indicator stroke color. |
| `viewportFillAlpha` | `number` | `0.3` | Viewport indicator fill opacity 0–1. |
| `viewportStrokeWidth` | `number` | `2` | Viewport indicator stroke width in pixels. |
| `padding` | `number` | `20` | World-space padding around content bounds. |
| `enableDrag` | `boolean` | `true` | Allow clicking/dragging the minimap to pan the main camera. |
| `position` | `MiniMapPosition` | `'bottom-right'` | Anchor corner inside the canvas parent element. |

`MiniMapPosition` is one of `'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`.

## API

### `refresh()`

Recomputes world bounds from current node positions. Call this after layout completes or whenever nodes move programmatically.

```ts
minimap.refresh();
```

### `setOptions(patch)`

Update any display option at runtime (size, colors, position, etc.).

```ts
minimap.setOptions({ position: 'top-right', width: 280 });
```

## Examples

### Bottom-right corner (default)

```ts
const minimap = new MiniMapPlugin({ width: 200, height: 150 });
await canvas.plugins.register(minimap);
minimap.refresh();
```

### Top-left with custom colors

```ts
const minimap = new MiniMapPlugin({
  position:          'top-left',
  width:             240,
  height:            160,
  backgroundColor:   0x0d1117,
  viewportFill:      0x58a6ff,
  viewportFillAlpha: 0.2,
  viewportStroke:    0x58a6ff,
});
await canvas.plugins.register(minimap);
minimap.refresh();
```

### Refresh after layout

```ts
// wait for a D3-force layout to stabilise, then update the minimap
d3Layout.on('end', () => minimap.refresh());
```
