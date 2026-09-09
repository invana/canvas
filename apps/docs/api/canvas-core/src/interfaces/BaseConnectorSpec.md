# Interface: BaseConnectorSpec

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

***

### kind

> `readonly` **kind**: `string`

***

### pathStyle?

> `readonly` `optional` **pathStyle?**: `string`

Registered pathStyle kind. Default `'normal'`.

***

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Per-pathStyle options forwarded to the pathStyle fn's `opts` parameter.

***

### router?

> `readonly` `optional` **router?**: `string`

Registered router kind. Default `'straight'`.

***

### routerOpts?

> `readonly` `optional` **routerOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Per-router options forwarded to the router fn's `opts` parameter.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Optional shape spec painted at the source endpoint, oriented along the path tangent.

***

### stroke?

> `readonly` `optional` **stroke?**: [`ShapeStroke`](ShapeStroke.md)

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Optional shape spec painted at the target endpoint, oriented along the path tangent.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly [`Point`](Point.md)[]

Intermediate user-supplied points the router must respect. Optional.

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`
