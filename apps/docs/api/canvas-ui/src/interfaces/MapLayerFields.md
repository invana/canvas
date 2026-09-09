# Interface: MapLayerFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`center: [lng, lat]` tuple is flattened to `centerLng` / `centerLat` scalars
(see `mapping.ts`), because a single field can't hold a tuple.

## Properties

### centerLat?

> `optional` **centerLat?**: `number`

Centre latitude in degrees.

***

### centerLng?

> `optional` **centerLng?**: `number`

Centre longitude in degrees.

***

### maxZoom?

> `optional` **maxZoom?**: `number`

***

### minZoom?

> `optional` **minZoom?**: `number`

***

### passInputToMap?

> `optional` **passInputToMap?**: `boolean`

***

### styleUrl?

> `optional` **styleUrl?**: `string`

***

### zoom?

> `optional` **zoom?**: `number`
