# Interface: BaseConnectorSpec

Defined in: [canvas/src/primitives/types.ts:580](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L580)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:600](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L600)

***

### kind

> `readonly` **kind**: `string`

Defined in: [canvas/src/primitives/types.ts:581](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L581)

***

### pathStyle?

> `readonly` `optional` **pathStyle?**: `string`

Defined in: [canvas/src/primitives/types.ts:591](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L591)

Registered pathStyle kind. Default `'normal'`.

***

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/primitives/types.ts:593](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L593)

Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter.

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [canvas/src/primitives/types.ts:587](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L587)

Registered router kind. Default `'straight'`.

***

### routerOpts?

> `readonly` `optional` **routerOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/primitives/types.ts:589](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L589)

Per-router options forwarded to the router fn's `opts` parameter.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [canvas/src/primitives/types.ts:582](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L582)

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [canvas/src/primitives/types.ts:595](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L595)

Optional shape spec painted at the source endpoint, oriented along the path tangent.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [canvas/src/primitives/types.ts:598](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L598)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [canvas/src/primitives/types.ts:583](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L583)

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [canvas/src/primitives/types.ts:597](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L597)

Optional shape spec painted at the target endpoint, oriented along the path tangent.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:601](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L601)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly [`Point`](Point.md)[]

Defined in: [canvas/src/primitives/types.ts:585](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L585)

Intermediate user-supplied points the router must respect. Optional.

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:599](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L599)
