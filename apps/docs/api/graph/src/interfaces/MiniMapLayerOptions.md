# Interface: MiniMapLayerOptions

Constructor options for `MiniMapLayer`.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Background fill used when [backgroundLayerId](#backgroundlayerid) is unset / unresolved. A
`0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`. Default
`0x1a1a2e`.

***

### backgroundLayerId?

> `optional` **backgroundLayerId?**: `string`

Id of a `BackgroundLayer` to mirror. When set, the minimap paints its
background with that layer's *resolved* colour — so the minimap backdrop
always matches the real canvas background (including theme flips) without
duplicating the colour here. Falls back to [backgroundColor](#backgroundcolor) when the
id is unset or the layer can't be resolved. Declared explicitly per the
canvas cross-layer rule — no inference of "the only background layer".

***

### borderColor?

> `optional` **borderColor?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Border colour. Same forms as `backgroundColor`. Default `0x444444`.

***

### borderWidth?

> `optional` **borderWidth?**: `number`

Border stroke width. Default `1`.

***

### enableDrag?

> `optional` **enableDrag?**: `boolean`

Whether dragging the minimap pans the main camera. Default `true`.

***

### graphLayerId

> **graphLayerId**: `string`

Required — the `GraphLayer` id this minimap mirrors.

***

### height?

> `optional` **height?**: `number`

Minimap height in screen pixels. Default `150`.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen corner, in screen pixels. Pass a single number for a
symmetric inset, or `{ x, y }` for independent horizontal / vertical insets
(e.g. to bottom-align the minimap with a control rail while clearing its
width). A missing axis on the object form falls back to `10`. Default `10`.

***

### maskAlpha?

> `optional` **maskAlpha?**: `number`

Out-of-viewport mask alpha 0–1. Default `0.5`.

***

### maskColor?

> `optional` **maskColor?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Out-of-viewport mask overlay colour. Same forms as [backgroundColor](#backgroundcolor)
(`0xRRGGBB` or a `{ light, dark }` pair resolved against `mode`). Default
`0x000000`.

***

### maskEnabled?

> `optional` **maskEnabled?**: `boolean`

Dim everything *outside* the viewport rectangle with a translucent overlay,
spotlighting the currently-visible region. Drawn above the mirrored world
(so out-of-view nodes/edges are dimmed) and clipped to the minimap box.
Default `true` — set `false` for the classic un-masked minimap.

***

### mode?

> `optional` **mode?**: [`MiniMapMode`](../type-aliases/MiniMapMode.md)

How `{ light, dark }` colour variants are resolved. `'auto'` (default)
follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. Has no
effect when every colour is a plain scalar. Flip it (e.g. from a theme
toggle via `useTheme`'s `minimapLayerId`) to swap the minimap chrome in
lockstep with the canvas BackgroundLayer.

***

### padding?

> `optional` **padding?**: `number`

World-space padding around node bounds. Default `20`.

***

### position?

> `optional` **position?**: [`MiniMapPosition`](../type-aliases/MiniMapPosition.md)

Anchor corner. Default `'bottom-right'`.

***

### viewportFill?

> `optional` **viewportFill?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Viewport indicator fill. Same forms as `backgroundColor`. Default `0x4a90d9`.

***

### viewportFillAlpha?

> `optional` **viewportFillAlpha?**: `number`

Viewport indicator fill alpha 0–1. Default `0.3`.

***

### viewportStroke?

> `optional` **viewportStroke?**: [`MiniMapColor`](../type-aliases/MiniMapColor.md)

Viewport indicator stroke. Same forms as `backgroundColor`. Default `0x2a70b9`.

***

### viewportStrokeWidth?

> `optional` **viewportStrokeWidth?**: `number`

Viewport indicator stroke width. Default `2`.

***

### width?

> `optional` **width?**: `number`

Minimap width in screen pixels. Default `200`.
