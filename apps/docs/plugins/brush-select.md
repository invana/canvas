# BrushSelectPlugin

Click-and-drag on the canvas background to draw an axis-aligned selection rectangle in **screen space**. Every node and edge whose rendered position falls inside the rectangle is added to the selection.

> **Package:** `@invana/plugins-graph-data`
>
> **Requires:** `GraphDataPlugin` registered first.
>
> **Works with:** [`ClickSelectPlugin`](./click-select.md) (optional). When a `ClickSelectPlugin` is registered, the brush delegates selection mutations through it so both stay in sync.

This plugin is **opt-in** — it does not modify any visual state until a drag occurs.

## Setup

```ts
import { GraphDataPlugin, ClickSelectPlugin, BrushSelectPlugin } from '@invana/plugins-graph-data';

await canvas.plugins.register(new GraphDataPlugin({ data }));
await canvas.plugins.register(new ClickSelectPlugin({ state: 'selected' }));

await canvas.plugins.register(new BrushSelectPlugin({
  trigger: ['shift'],   // hold Shift and drag to activate
}));
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'brush-select'` | Plugin id override. |
| `graphDataId` | `string` | `'graph-data'` | Id of the `GraphDataPlugin` to read through. |
| `clickSelectId` | `string` | `'click-select'` | Id of the optional `ClickSelectPlugin` to delegate to. |
| `enable` | `boolean \| (event) => boolean` | `true` | Global on/off or per-pointerdown predicate. |
| `enableElements` | `BrushSelectElementType[]` | `['shape', 'connector']` | Element types eligible for brush selection. |
| `trigger` | `BrushModifierKey[]` | `['shift']` | Modifier key(s) that must be held during pointerdown to activate the brush. Pass `[]` to activate on any background drag. |
| `immediately` | `boolean` | `false` | When `true`, selection updates live while drawing. When `false`, applied on pointer release. |
| `state` | `string` | `'selected'` | State applied when no `ClickSelectPlugin` is registered (fallback path). |
| `style` | `BrushSelectStyle` | (see below) | Visual style for the rectangle overlay. |
| `clearOnBackground` | `boolean` | `true` | Clear the selection when clicking without dragging. |
| `onSelect` | `(snapshot) => void` | — | Called after a brush release that produced a selection change. |

### `BrushSelectStyle`

| Property | Type | Default | Description |
|---|---|---|---|
| `fill` | `number` | `0x1677ff` | Fill color as `0xRRGGBB`. |
| `fillAlpha` | `number` | `0.1` | Fill opacity 0–1. |
| `stroke` | `number` | `0x1677ff` | Stroke color as `0xRRGGBB`. |
| `strokeAlpha` | `number` | `0.8` | Stroke opacity 0–1. |
| `strokeWidth` | `number` | `1` | Stroke line width in pixels. |
| `strokeDash` | `number[]` | `[4, 4]` | Dash pattern `[dashLen, gapLen]`. Set to `[]` for a solid border. |

`BrushModifierKey` is one of `'shift' | 'control' | 'alt' | 'meta'`.

## API

### `setOptions(patch)`

Update any option at runtime.

```ts
brush.setOptions({ immediately: true, trigger: [] });
```

## Brush vs Lasso

| | BrushSelectPlugin | LassoSelectPlugin |
|---|---|---|
| Shape | Axis-aligned rectangle | Freeform polygon |
| Space | Screen space | World space |
| Use case | Quick rectangular region | Irregular graph areas |

## Examples

### With ClickSelectPlugin (recommended)

```ts
await canvas.plugins.register(new GraphDataPlugin({ data }));
await canvas.plugins.register(new ClickSelectPlugin({ multiple: true, state: 'selected' }));
await canvas.plugins.register(new BrushSelectPlugin({ trigger: ['shift'] }));
```

### Nodes only

```ts
await canvas.plugins.register(new BrushSelectPlugin({
  enableElements: ['shape'],
}));
```

### Live selection while drawing

```ts
await canvas.plugins.register(new BrushSelectPlugin({
  immediately: true,
  trigger:     [],   // no modifier required
}));
```

### Custom style

```ts
await canvas.plugins.register(new BrushSelectPlugin({
  style: {
    fill:        0xff6b00,
    fillAlpha:   0.08,
    stroke:      0xff6b00,
    strokeAlpha: 1,
    strokeDash:  [],
  },
}));
```
