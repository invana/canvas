# Interface: BaseConnectorSpec

Defined in: [packages/canvas/src/primitives/types.ts:464](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L464)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:484](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L484)

***

### kind

> `readonly` **kind**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:465](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L465)

***

### pathStyle?

> `readonly` `optional` **pathStyle?**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:475](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L475)

Registered pathStyle kind. Default `'normal'`.

***

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [packages/canvas/src/primitives/types.ts:477](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L477)

Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter.

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [packages/canvas/src/primitives/types.ts:471](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L471)

Registered router kind. Default `'straight'`.

***

### routerOpts?

> `readonly` `optional` **routerOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [packages/canvas/src/primitives/types.ts:473](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L473)

Per-router options forwarded to the router fn's `opts` parameter.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/primitives/types.ts:466](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L466)

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [packages/canvas/src/primitives/types.ts:479](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L479)

Optional shape spec painted at the source endpoint, oriented along the path tangent.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [packages/canvas/src/primitives/types.ts:482](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L482)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/primitives/types.ts:467](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L467)

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [packages/canvas/src/primitives/types.ts:481](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L481)

Optional shape spec painted at the target endpoint, oriented along the path tangent.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:485](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L485)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly [`Point`](Point.md)[]

Defined in: [packages/canvas/src/primitives/types.ts:469](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L469)

Intermediate user-supplied points the router must respect. Optional.

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:483](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L483)
