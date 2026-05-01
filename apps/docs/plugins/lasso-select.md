# LassoSelectPlugin

Click-and-drag on the canvas background to draw a freeform polygon in **world space**. Every node and edge enclosed by the polygon is added to the selection.

> **Package:** `@invana/plugins-graph-data`
>
> **Requires:** `GraphDataPlugin` registered first.
>
> **Works with:** [`ClickSelectPlugin`](./click-select.md) (optional). When a `ClickSelectPlugin` is registered, the lasso delegates selection mutations through it so both stay in sync.

This plugin is **opt-in** — it does not modify any visual state until a drag occurs.

The polygon lives in **world space**, so it stays glued to the graph during pan/zoom while the user draws — unlike `BrushSelectPlugin`, whose axis-aligned rectangle lives in screen space.

## Setup

```ts
import { GraphDataPlugin, ClickSelectPlugin, LassoSelectPlugin } from '@invana/plugins-graph-data';

await canvas.plugins.register(new GraphDataPlugin({ data }));
await canvas.plugins.register(new ClickSelectPlugin({ state: 'selected' }));

await canvas.plugins.register(new LassoSelectPlugin({
  trigger: ['shift'],   // hold Shift and drag to activate
}));
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | `'lasso-select'` | Plugin id override. |
| `graphDataId` | `string` | `'graph-data'` | Id of the `GraphDataPlugin` to read through. |
| `clickSelectId` | `string` | `'click-select'` | Id of the optional `ClickSelectPlugin` to delegate to. |
| `enable` | `boolean \| (event) => boolean` | `true` | Global on/off or per-pointerdown predicate. |
| `enableElements` | `LassoSelectElementType[]` | `['shape', 'connector']` | Element types eligible for lasso selection. |
| `trigger` | `LassoModifierKey[]` | `['shift']` | Modifier key(s) that must be held during pointerdown to activate the lasso. Pass `[]` to activate on any background drag. |
| `immediately` | `boolean` | `false` | When `true`, selection updates live while drawing. When `false`, applied on pointer release. |
| `state` | `string` | `'selected'` | State applied when no `ClickSelectPlugin` is registered (fallback path). |
| `style` | `LassoSelectStyle` | (see below) | Visual style for the polygon overlay. |
| `clearOnBackground` | `boolean` | `true` | Clear the selection when clicking without dragging. |
| `onSelect` | `(snapshot) => void` | — | Called after a lasso release that produced a selection change. |

### `LassoSelectStyle`

| Property | Type | Default | Description |
|---|---|---|---|
| `fill` | `number` | `0x1677ff` | Fill color as `0xRRGGBB`. |
| `fillAlpha` | `number` | `0.1` | Fill opacity 0–1. |
| `stroke` | `number` | `0x1677ff` | Stroke color as `0xRRGGBB`. |
| `strokeAlpha` | `number` | `0.8` | Stroke opacity 0–1. |
| `strokeWidth` | `number` | `1` | Stroke line width in pixels. |
| `strokeDash` | `number[]` | `[4, 4]` | Dash pattern `[dashLen, gapLen]`. Set to `[]` for a solid border. |

`LassoModifierKey` is one of `'shift' | 'control' | 'alt' | 'meta'`.

## API

### `setOptions(patch)`

Update any option at runtime.

```ts
lasso.setOptions({ immediately: true, trigger: [] });
```

## Lasso vs Brush

| | LassoSelectPlugin | BrushSelectPlugin |
|---|---|---|
| Shape | Freeform polygon | Axis-aligned rectangle |
| Space | World space | Screen space |
| Use case | Irregular graph areas | Quick rectangular region |

## Examples

### With ClickSelectPlugin (recommended)

```ts
await canvas.plugins.register(new GraphDataPlugin({ data }));
await canvas.plugins.register(new ClickSelectPlugin({ multiple: true, state: 'selected' }));
await canvas.plugins.register(new LassoSelectPlugin({ trigger: ['shift'] }));
```

### Nodes only

```ts
await canvas.plugins.register(new LassoSelectPlugin({
  enableElements: ['shape'],
}));
```

### Live selection while drawing

```ts
await canvas.plugins.register(new LassoSelectPlugin({
  immediately: true,
  trigger:     [],   // no modifier required
}));
```

### Custom style

```ts
await canvas.plugins.register(new LassoSelectPlugin({
  style: {
    fill:        0x00c853,
    fillAlpha:   0.1,
    stroke:      0x00c853,
    strokeAlpha: 0.9,
    strokeDash:  [6, 3],
  },
}));
```
