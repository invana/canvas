# Interface: MiniMapLayerOptions

Defined in: [graph/src/layer/MiniMapLayer.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L54)

Constructor options for `MiniMapLayer`.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L76)

Background fill used when [backgroundLayerId](#backgroundlayerid) is unset / unresolved. A
`0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`. Default
`0x1a1a2e`.

***

### backgroundLayerId?

> `optional` **backgroundLayerId?**: `string`

Defined in: [graph/src/layer/MiniMapLayer.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L70)

Id of a `BackgroundLayer` to mirror. When set, the minimap paints its
background with that layer's *resolved* colour — so the minimap backdrop
always matches the real canvas background (including theme flips) without
duplicating the colour here. Falls back to [backgroundColor](#backgroundcolor) when the
id is unset or the layer can't be resolved. Declared explicitly per the
canvas cross-layer rule — no inference of "the only background layer".

***

### borderColor?

> `optional` **borderColor?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L78)

Border colour. Same forms as `backgroundColor`. Default `0x444444`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L80)

Border stroke width. Default `1`.

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Defined in: [graph/src/layer/MiniMapLayer.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L94)

Whether dragging the minimap pans the main camera. Default `true`.

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph/src/layer/MiniMapLayer.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L56)

Required — the `GraphLayer` id this minimap mirrors.

***

### height?

> `optional` **height?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L61)

Minimap height in screen pixels. Default `150`.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Defined in: [graph/src/layer/MiniMapLayer.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L111)

Inset from the chosen corner, in screen pixels. Pass a single number for a
symmetric inset, or `{ x, y }` for independent horizontal / vertical insets
(e.g. to bottom-align the minimap with a control rail while clearing its
width). A missing axis on the object form falls back to `10`. Default `10`.

***

### mode?

> `optional` **mode?**: [`MiniMapMode`](../type-aliases/MiniMapMode.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L104)

How `{ light, dark }` colour variants are resolved. `'auto'` (default)
follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. Has no
effect when every colour is a plain scalar. Flip it (e.g. from a theme
toggle via `useTheme`'s `minimapLayerId`) to swap the minimap chrome in
lockstep with the canvas BackgroundLayer.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L92)

World-space padding around node bounds. Default `20`.

***

### position?

> `optional` **position?**: [`MiniMapPosition`](../type-aliases/MiniMapPosition.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L96)

Anchor corner. Default `'bottom-right'`.

***

### viewportFill?

> `optional` **viewportFill?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L83)

Viewport indicator fill. Same forms as `backgroundColor`. Default `0x4a90d9`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L87)

Viewport indicator fill alpha 0–1. Default `0.3`.

***

### viewportStroke?

> `optional` **viewportStroke?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L85)

Viewport indicator stroke. Same forms as `backgroundColor`. Default `0x2a70b9`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:89](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L89)

Viewport indicator stroke width. Default `2`.

***

### width?

> `optional` **width?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/MiniMapLayer.ts#L59)

Minimap width in screen pixels. Default `200`.
