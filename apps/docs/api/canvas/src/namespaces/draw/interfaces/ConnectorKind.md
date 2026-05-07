# Interface: ConnectorKind\<TSpec\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:132](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L132)

Connector primitive descriptor.

`draw` emits a polyline into the supplied Graphics. Nothing else —
no markers, no labels. The polyline arrives pre-routed (the renderer
runs the registered router and caches the result).

`bounds` returns the polyline AABB inflated by stroke half-width.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Methods

### bounds()

> **bounds**(`polyline`, `spec`): [`Rect`](Rect.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:134](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L134)

#### Parameters

##### polyline

readonly [`Point`](Point.md)[]

##### spec

`TSpec`

#### Returns

[`Rect`](Rect.md)

***

### draw()

> **draw**(`g`, `polyline`, `spec`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:133](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L133)

#### Parameters

##### g

[`Graphics`](../../../interfaces/Graphics.md)

##### polyline

readonly [`Point`](Point.md)[]

##### spec

`TSpec`

#### Returns

`void`
