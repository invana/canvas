# Interface: MiniMapLayerOptions

Defined in: [graph/src/layer/MiniMapLayer.ts:38](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L38)

Constructor options for `MiniMapLayer`.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:47](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L47)

Background fill `0xRRGGBB`. Default `0x1a1a2e`.

***

### borderColor?

> `optional` **borderColor?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:49](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L49)

Border colour `0xRRGGBB`. Default `0x444444`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:51](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L51)

Border stroke width. Default `1`.

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Defined in: [graph/src/layer/MiniMapLayer.ts:65](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L65)

Whether dragging the minimap pans the main camera. Default `true`.

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph/src/layer/MiniMapLayer.ts:40](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L40)

Required — the `GraphLayer` id this minimap mirrors.

***

### height?

> `optional` **height?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:45](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L45)

Minimap height in screen pixels. Default `150`.

***

### margin?

> `optional` **margin?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:69](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L69)

Distance from the chosen corner, in screen pixels. Default `10`.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:63](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L63)

World-space padding around node bounds. Default `20`.

***

### position?

> `optional` **position?**: [`MiniMapPosition`](../type-aliases/MiniMapPosition.md)

Defined in: [graph/src/layer/MiniMapLayer.ts:67](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L67)

Anchor corner. Default `'bottom-right'`.

***

### viewportFill?

> `optional` **viewportFill?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:54](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L54)

Viewport indicator fill. Default `0x4a90d9`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:58](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L58)

Viewport indicator fill alpha 0–1. Default `0.3`.

***

### viewportStroke?

> `optional` **viewportStroke?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:56](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L56)

Viewport indicator stroke. Default `0x2a70b9`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:60](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L60)

Viewport indicator stroke width. Default `2`.

***

### width?

> `optional` **width?**: `number`

Defined in: [graph/src/layer/MiniMapLayer.ts:43](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/MiniMapLayer.ts#L43)

Minimap width in screen pixels. Default `200`.
