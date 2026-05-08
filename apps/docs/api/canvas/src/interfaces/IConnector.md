# Interface: IConnector\<TSpec\>

Defined in: packages/canvas/src/primitives/types.ts:356

A line-like primitive joining two endpoints, optionally passing through
waypoints. v0 has a single concrete `Connector` class; visual variation
comes from the router (which produces the `Path`).

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: packages/canvas/src/primitives/types.ts:357

## Methods

### destroy()

> **destroy**(): `void`

Defined in: packages/canvas/src/primitives/types.ts:366

#### Returns

`void`

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: packages/canvas/src/primitives/types.ts:359

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

Defined in: packages/canvas/src/primitives/types.ts:365

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
