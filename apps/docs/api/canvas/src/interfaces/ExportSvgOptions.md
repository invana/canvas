# Interface: ExportSvgOptions

Options for Canvas.exportSVG (a subset of the raster options).

## Properties

### area?

> `optional` **area?**: [`ExportArea`](../type-aliases/ExportArea.md)

Capture area. Default `'viewport'`.

***

### aspectRatio?

> `optional` **aspectRatio?**: `number`

Force a specific output aspect ratio (width ÷ height). The `viewBox` is
letterboxed to it — grown + re-centred, never cropped. Default: no constraint.

***

### background?

> `optional` **background?**: `string` \| `number`

Background fill. Default `'canvas'`. `'transparent'` omits the backing rect.

***

### padding?

> `optional` **padding?**: `number`

World padding around the content bounds (`area: 'content'` only). Default `24`.

***

### scale?

> `optional` **scale?**: `number`

Multiplier for the SVG's pixel `width`/`height` attributes (the `viewBox` is unaffected). Default `1`.
