# Interface: IConnector\<TSpec\>

Defined in: [packages/canvas/src/primitives/types.ts:620](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L620)

A line-like primitive joining two endpoints, optionally passing through
waypoints. v0 has a single concrete `Connector` class; visual variation
comes from the router (which produces the `Path`).

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:621](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L621)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/types.ts:630](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L630)

#### Returns

`void`

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:623](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L623)

(Re)paint the connector with a router-resolved `Path`.

#### Parameters

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

`void`

***

### paintInto()

> **paintInto**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:629](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L629)

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. Connector decorations
use this to draw with pixel-identical silhouette coverage.

#### Parameters

##### g

[`Graphics`](Graphics.md)

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](ConnectorPaintStyle.md)

#### Returns

`void`
