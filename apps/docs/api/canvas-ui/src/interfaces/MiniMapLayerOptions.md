# Interface: MiniMapLayerOptions

The subset of `MiniMapLayerOptions` this editor produces — a serialisable
patch. The identity field `graphLayerId` and the cross-layer reference
`backgroundLayerId` are out of scope (not user-tunable state). Colours are
emitted as hex strings; `margin` is emitted as a scalar number (the engine's
`{ x, y }` object form is out of scope and round-trips untouched).

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Background fill as `0xRRGGBB`. Default `0x1a1a2e`.

***

### borderColor?

> `optional` **borderColor?**: `number`

Border colour as `0xRRGGBB`. Default `0x444444`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Border stroke width. Default `1`.

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Whether dragging the minimap pans the main camera. Default `true`.

***

### height?

> `optional` **height?**: `number`

Minimap height in screen px. Default `150`.

***

### margin?

> `optional` **margin?**: `number`

Symmetric inset from the chosen corner, in screen px. Default `10`.

***

### maskAlpha?

> `optional` **maskAlpha?**: `number`

Out-of-viewport mask alpha 0–1. Default `0.5`.

***

### maskColor?

> `optional` **maskColor?**: `number`

Out-of-viewport mask overlay colour as `0xRRGGBB`. Default `0x000000`.

***

### maskEnabled?

> `optional` **maskEnabled?**: `boolean`

Dim everything *outside* the viewport rectangle with a translucent overlay,
 spotlighting the visible region. Default `true`.

***

### mode?

> `optional` **mode?**: `MiniMapMode`

How `{ light, dark }` colour variants resolve. Default `'auto'`.

***

### padding?

> `optional` **padding?**: `number`

World-space padding around node bounds. Default `20`.

***

### position?

> `optional` **position?**: `MiniMapPosition`

Anchor corner. Default `'bottom-right'`.

***

### viewportFill?

> `optional` **viewportFill?**: `number`

Viewport indicator fill as `0xRRGGBB`. Default `0x4a90d9`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Viewport indicator fill alpha 0–1. Default `0.3`.

***

### viewportStroke?

> `optional` **viewportStroke?**: `number`

Viewport indicator stroke as `0xRRGGBB`. Default `0x2a70b9`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Viewport indicator stroke width. Default `2`.

***

### width?

> `optional` **width?**: `number`

Minimap width in screen px. Default `200`.
