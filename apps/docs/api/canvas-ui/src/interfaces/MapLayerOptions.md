# Interface: MapLayerOptions

The subset of `MapLayerOptions` this editor produces — a serialisable patch.
The `mountTarget` HTMLElement handle is out of scope (non-serialisable DOM
ref). `styleUrl` keeps only its scalar string form (a full StyleSpecification
object is out of scope and round-trips untouched). `center` keeps the
engine's `[lng, lat]` tuple encoding — the form flattens it (see `types` /
`mapping.ts`).

## Properties

### center?

> `optional` **center?**: \[`number`, `number`\]

Initial map centre as `[lng, lat]` in degrees.

***

### maxZoom?

> `optional` **maxZoom?**: `number`

Maximum allowed MapLibre zoom.

***

### minZoom?

> `optional` **minZoom?**: `number`

Minimum allowed MapLibre zoom.

***

### passInputToMap?

> `optional` **passInputToMap?**: `boolean`

Make the Pixi canvas pointer-transparent so MapLibre receives all input
(pan / zoom / click). Default `true`.

***

### styleUrl?

> `optional` **styleUrl?**: `string`

MapLibre style URL (string form only).

***

### zoom?

> `optional` **zoom?**: `number`

Initial MapLibre zoom level (0..22).
