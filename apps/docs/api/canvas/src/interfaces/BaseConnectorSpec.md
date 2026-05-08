# Interface: BaseConnectorSpec

Defined in: packages/canvas/src/primitives/types.ts:239

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:253

***

### kind

> `readonly` **kind**: `string`

Defined in: packages/canvas/src/primitives/types.ts:240

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: packages/canvas/src/primitives/types.ts:246

Registered router kind. Default `'straight'`.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: packages/canvas/src/primitives/types.ts:241

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: packages/canvas/src/primitives/types.ts:248

Optional shape spec painted at the source endpoint, oriented along the path tangent.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: packages/canvas/src/primitives/types.ts:251

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: packages/canvas/src/primitives/types.ts:242

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: packages/canvas/src/primitives/types.ts:250

Optional shape spec painted at the target endpoint, oriented along the path tangent.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: packages/canvas/src/primitives/types.ts:254

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly [`Point`](Point.md)[]

Defined in: packages/canvas/src/primitives/types.ts:244

Intermediate user-supplied points the router must respect. Optional.

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: packages/canvas/src/primitives/types.ts:252
