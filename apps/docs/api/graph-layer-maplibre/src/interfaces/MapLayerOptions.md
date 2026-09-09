# Interface: MapLayerOptions

Construction-time options for [MapLayer](../classes/MapLayer.md).

The layer is intentionally thin: it hosts a MapLibre map, projects
`[lng, lat]` to stable world coords (web-mercator pixels at zoom 0), and
syncs the canvas camera so anything drawn at those world coords lines up
pixel-accurately with the basemap as the user pans / zooms.

## Properties

### center?

> `optional` **center?**: [`LngLat`](../type-aliases/LngLat.md)

Initial map centre as `[lng, lat]`. Default `[0, 20]`.

***

### maxZoom?

> `optional` **maxZoom?**: `number`

***

### minZoom?

> `optional` **minZoom?**: `number`

Minimum / maximum allowed MapLibre zoom. Defaults `0` / `22`. The canvas
camera mirrors `2^zoom` as its scale, so these implicitly clamp how far
the user can zoom the engine view too.

***

### mountTarget?

> `optional` **mountTarget?**: `HTMLElement`

Optional DOM element the map is mounted into. If omitted, the layer
inserts a new `<div>` as the first child of the Pixi canvas's parent
element (so the basemap renders *behind* the Pixi canvas).

***

### passInputToMap?

> `optional` **passInputToMap?**: `boolean`

Make the Pixi canvas pointer-event-transparent so MapLibre receives all
mouse / touch input (pan, zoom, click). Default `true`. Set `false` if
you want Pixi-layer behaviours (hover, click-select) to take input
priority — you'll then have to drive map pan/zoom by other means.

***

### styleUrl?

> `optional` **styleUrl?**: `string` \| `object`

MapLibre style URL. Defaults to the OpenFreeMap "liberty" style
(https://openfreemap.org) — free, no-key, OSM-based vector tiles. Pass a
different URL or a full StyleSpecification object to swap basemaps.

***

### zoom?

> `optional` **zoom?**: `number`

Initial MapLibre zoom level (0..22). Default `1.5`.
