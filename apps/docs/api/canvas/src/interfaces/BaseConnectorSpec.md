# Interface: BaseConnectorSpec

Defined in: [packages/canvas/src/renderers/types.ts:86](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L86)

Common connector fields. Every connector spec extends this with its own
`kind` discriminant + drawing fields. Endpoints may resolve to either raw
coordinates or another shape id (the renderer resolves shape-bound endpoints
on every router pass).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:103](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L103)

***

### kind

> `readonly` **kind**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:87](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L87)

***

### router?

> `readonly` `optional` **router?**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:91](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L91)

Registered router kind. Default `'straight'`.

***

### source

> `readonly` **source**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/types.ts:88](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L88)

***

### sourceMarker?

> `readonly` `optional` **sourceMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [packages/canvas/src/renderers/types.ts:99](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L99)

Source-side marker. Any registered shape spec (e.g. polygon, circle,
path) painted at the source endpoint, oriented along the line tangent.
Use the `arrowMarkerSpec` / `circleMarkerSpec` / `squareMarkerSpec` /
`diamondMarkerSpec` builders from the renderer barrel for the common
cases.

***

### target

> `readonly` **target**: [`ConnectorEndpointSpec`](../type-aliases/ConnectorEndpointSpec.md)

Defined in: [packages/canvas/src/renderers/types.ts:89](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L89)

***

### targetMarker?

> `readonly` `optional` **targetMarker?**: [`MarkerShapeSpec`](../type-aliases/MarkerShapeSpec.md)

Defined in: [packages/canvas/src/renderers/types.ts:101](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L101)

Target-side marker. See `sourceMarker`.

***

### visible?

> `readonly` `optional` **visible?**: `boolean`

Defined in: [packages/canvas/src/renderers/types.ts:104](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L104)

***

### zIndex?

> `readonly` `optional` **zIndex?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:102](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L102)
