# Interface: IConnector\<TSpec\>

Defined in: [packages/canvas/src/renderers/types.ts:303](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L303)

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:304](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L304)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/renderers/types.ts:324](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L324)

#### Returns

`void`

***

### draw()

> **draw**(`spec`, `points`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:306](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L306)

(Re)paint the connector with a router-resolved polyline.

#### Parameters

##### spec

`TSpec`

##### points

readonly [`ShapesPoint`](ShapesPoint.md)[]

#### Returns

`void`

***

### paintInto()?

> `optional` **paintInto**(`g`, `spec`, `points`, `style`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:318](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L318)

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. The caller has
`g.clear()`ed the Graphics before calling. Connector decorations use
this to draw with pixel-identical silhouette coverage — they never
re-derive geometry from the polyline.

Optional for back-compat: third-party `IConnector` implementations
keep compiling without it; decorations check for presence and otherwise
fall back. Both built-ins (`line`, `curve`) implement it.

#### Parameters

##### g

[`Graphics`](Graphics.md)

##### spec

`TSpec`

##### points

readonly [`ShapesPoint`](ShapesPoint.md)[]

##### style

[`ConnectorPaintStyle`](ConnectorPaintStyle.md)

#### Returns

`void`
