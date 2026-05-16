# Interface: BaseConnectorSpec

Defined in: [canvas/src/primitives/types.ts:515](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L515)

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/types.ts:535](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L535)

***

### kind

> `readonly` **kind**: `string`

Defined in: [canvas/src/primitives/types.ts:516](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L516)

***

### pathStyle?

> `readonly` `optional` **pathStyle?**: `string`

Defined in: [canvas/src/primitives/types.ts:526](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L526)

Registered pathStyle kind. Default `'normal'`.

***

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/primitives/types.ts:528](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L528)

Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter.

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [canvas/src/primitives/types.ts:522](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L522)

Registered router kind. Default `'straight'`.

***

### routerOpts?

> `readonly` `optional` **routerOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/primitives/types.ts:524](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L524)

Per-router options forwarded to the router fn's `opts` parameter.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [canvas/src/primitives/types.ts:517](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L517)

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [canvas/src/primitives/types.ts:530](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L530)

Optional shape spec painted at the source endpoint, oriented along the path tangent.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

Defined in: [canvas/src/primitives/types.ts:533](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L533)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [canvas/src/primitives/types.ts:518](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L518)

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [canvas/src/primitives/types.ts:532](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L532)

Optional shape spec painted at the target endpoint, oriented along the path tangent.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [canvas/src/primitives/types.ts:536](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L536)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly [`Point`](Point.md)[]

Defined in: [canvas/src/primitives/types.ts:520](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L520)

Intermediate user-supplied points the router must respect. Optional.

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [canvas/src/primitives/types.ts:534](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L534)
