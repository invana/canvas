# Interface: IConnector\<TSpec\>

Defined in: [canvas/src/primitives/types.ts:770](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L770)

A line-like primitive joining two endpoints, optionally passing through
waypoints. v0 has a single concrete `Connector` class; visual variation
comes from the router (which produces the `Path`).

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/types.ts:771](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L771)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:803](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L803)

#### Returns

`void`

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [canvas/src/primitives/types.ts:773](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L773)

(Re)paint the connector with a router-resolved `Path`.

#### Parameters

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

`void`

***

### getVisiblePath()

> **getVisiblePath**(`spec`, `path`): [`Path`](../type-aliases/Path.md)

Defined in: [canvas/src/primitives/types.ts:789](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L789)

Path trimmed by the source / target marker insets — i.e. the *visible*
body of the connector, with the segments that the markers cover removed.
Decorations that parameterise along arc length (ripple, fly-marker,
flow-particles, label-along-path, …) call this so `t = 1` lands at the
marker base rather than the marker tip (which sits inside the target
shape and hides the ripple's inner rings under the silhouette).
Returns the input path unchanged when no markers are configured.

#### Parameters

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

#### Returns

[`Path`](../type-aliases/Path.md)

***

### paintInto()

> **paintInto**(`g`, `spec`, `path`, `style?`): `void`

Defined in: [canvas/src/primitives/types.ts:779](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L779)

Repaint the connector's full silhouette (path + markers) into a
caller-supplied `Graphics` with style overrides. Connector decorations
use this to draw with pixel-identical silhouette coverage.

#### Parameters

##### g

`Graphics`

##### spec

`TSpec`

##### path

[`Path`](../type-aliases/Path.md)

##### style?

[`ConnectorPaintStyle`](ConnectorPaintStyle.md)

#### Returns

`void`

***

### setBodyVisible()

> **setBodyVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/types.ts:798](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L798)

Toggle the body stroke without affecting markers or decoration children.
Body, source marker, and target marker live in three sibling Graphics
under `gfx`, so each can be hidden independently — used by a reveal
animation that owns the visible line and pops the ending marker in
when the reveal reaches it. The next `draw()` re-strokes the body but
preserves the hidden state.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### setSourceMarkerVisible()

> **setSourceMarkerVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/types.ts:800](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L800)

Toggle just the source-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### setTargetMarkerVisible()

> **setTargetMarkerVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/types.ts:802](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L802)

Toggle just the target-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
