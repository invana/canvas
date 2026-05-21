# Interface: MiniMapLayerOptions

Defined in: [graph/src/layer/MiniMapLayer.ts:39](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L39)

Constructor options for `MiniMapLayer`.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:48](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L48)

Background fill `0xRRGGBB`. Default `0x1a1a2e`.

***

### borderColor?

> `optional` **borderColor?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:50](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L50)

Border colour `0xRRGGBB`. Default `0x444444`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:52](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L52)

Border stroke width. Default `1`.

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Defined in: [graph/src/layer/MiniMapLayer.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L66)

Whether dragging the minimap pans the main camera. Default `true`.

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph/src/layer/MiniMapLayer.ts:41](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L41)

Required — the `GraphLayer` id this minimap mirrors.

***

### height?

> `optional` **height?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:46](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L46)

Minimap height in screen pixels. Default `150`.

***

### margin?

> `optional` **margin?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:70](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L70)

Distance from the chosen corner, in screen pixels. Default `10`.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:64](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L64)

World-space padding around node bounds. Default `20`.

***

### position?

> `optional` **position?**: [`MiniMapPosition`](../type-aliases/MiniMapPosition.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:68](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L68)

Anchor corner. Default `'bottom-right'`.

***

### viewportFill?

> `optional` **viewportFill?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L55)

Viewport indicator fill. Default `0x4a90d9`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:59](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L59)

Viewport indicator fill alpha 0–1. Default `0.3`.

***

### viewportStroke?

> `optional` **viewportStroke?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:57](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L57)

Viewport indicator stroke. Default `0x2a70b9`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:61](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L61)

Viewport indicator stroke width. Default `2`.

***

### width?

> `optional` **width?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/MiniMapLayer.ts#L44)

Minimap width in screen pixels. Default `200`.
