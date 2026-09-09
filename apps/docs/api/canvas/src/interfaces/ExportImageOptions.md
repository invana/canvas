# Interface: ExportImageOptions

Options for [Canvas.export](../classes/Canvas.md#export) / [Canvas.exportDataURL](../classes/Canvas.md#exportdataurl).

## Properties

### area?

> `optional` **area?**: [`ExportArea`](../type-aliases/ExportArea.md)

Capture area. Default `'viewport'`.

***

### aspectRatio?

> `optional` **aspectRatio?**: `number`

Force a specific output aspect ratio (width ÷ height, e.g. `16/9`, `1`).
The capture region is letterboxed to it — grown + re-centred, never
cropped — with the background filling the added margin. Default: no
constraint (the region's natural ratio).

***

### background?

> `optional` **background?**: [`ExportBackground`](../type-aliases/ExportBackground.md)

Background fill. Default `'canvas'`. See [ExportBackground](../type-aliases/ExportBackground.md).

***

### format?

> `optional` **format?**: `"svg"` \| [`ExportRasterFormat`](../type-aliases/ExportRasterFormat.md)

Output format. Default `'png'`. `'svg'` routes to the vector exporter.

***

### maxSize?

> `optional` **maxSize?**: `number`

Clamp for the longest output edge in pixels — guards against exceeding the
GPU's max texture size on huge/zoomed exports. When the request would
exceed it, the resolution is scaled down to fit. Default `8192`.

***

### padding?

> `optional` **padding?**: `number`

Extra world-space padding around the content bounds (`area: 'content'` only). Default `24`.

***

### quality?

> `optional` **quality?**: `number`

Encoder quality `0..1` for `'jpeg'` / `'webp'`. Ignored for `'png'`.

***

### scale?

> `optional` **scale?**: `number`

Resolution multiplier applied on top of the mode's base resolution.
Default = `window.devicePixelRatio` (≥ 1). Bump it for a higher-DPI export;
the result is clamped by [maxSize](#maxsize).
