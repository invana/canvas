# Interface: DownloadImageExportOptions

Extension of the engine export options with a download filename.

## Extends

- `ExportImageOptions`

## Properties

### area?

> `optional` **area?**: `ExportArea`

Capture area. Default `'viewport'`.

#### Inherited from

`ExportImageOptions.area`

***

### aspectRatio?

> `optional` **aspectRatio?**: `number`

Force a specific output aspect ratio (width ÷ height, e.g. `16/9`, `1`).
The capture region is letterboxed to it — grown + re-centred, never
cropped — with the background filling the added margin. Default: no
constraint (the region's natural ratio).

#### Inherited from

`ExportImageOptions.aspectRatio`

***

### background?

> `optional` **background?**: `ExportBackground`

Background fill. Default `'canvas'`. See ExportBackground.

#### Inherited from

`ExportImageOptions.background`

***

### filename?

> `optional` **filename?**: `string`

File name for the download. Defaults to `canvas.<ext>` for the format.

***

### format?

> `optional` **format?**: `"svg"` \| `ExportRasterFormat`

Output format. Default `'png'`. `'svg'` routes to the vector exporter.

#### Inherited from

`ExportImageOptions.format`

***

### maxSize?

> `optional` **maxSize?**: `number`

Clamp for the longest output edge in pixels — guards against exceeding the
GPU's max texture size on huge/zoomed exports. When the request would
exceed it, the resolution is scaled down to fit. Default `8192`.

#### Inherited from

`ExportImageOptions.maxSize`

***

### padding?

> `optional` **padding?**: `number`

Extra world-space padding around the content bounds (`area: 'content'` only). Default `24`.

#### Inherited from

`ExportImageOptions.padding`

***

### quality?

> `optional` **quality?**: `number`

Encoder quality `0..1` for `'jpeg'` / `'webp'`. Ignored for `'png'`.

#### Inherited from

`ExportImageOptions.quality`

***

### scale?

> `optional` **scale?**: `number`

Resolution multiplier applied on top of the mode's base resolution.
Default = `window.devicePixelRatio` (≥ 1). Bump it for a higher-DPI export;
the result is clamped by [maxSize](#maxsize).

#### Inherited from

`ExportImageOptions.scale`
