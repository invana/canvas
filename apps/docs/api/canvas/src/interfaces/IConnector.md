# Interface: IConnector\<TSpec\>

Defined in: [canvas/src/primitives/types.ts:692](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L692)

A line-like primitive joining two endpoints, optionally passing through
waypoints. v0 has a single concrete `Connector` class; visual variation
comes from the router (which produces the `Path`).

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](BaseConnectorSpec.md) = [`BaseConnectorSpec`](BaseConnectorSpec.md)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/types.ts:693](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L693)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:725](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L725)

#### Returns

`void`

***

### draw()

> **draw**(`spec`, `path`): `void`

Defined in: [canvas/src/primitives/types.ts:695](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L695)

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

Defined in: [canvas/src/primitives/types.ts:711](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L711)

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

Defined in: [canvas/src/primitives/types.ts:701](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L701)

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

Defined in: [canvas/src/primitives/types.ts:720](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L720)

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

Defined in: [canvas/src/primitives/types.ts:722](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L722)

Toggle just the source-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

***

### setTargetMarkerVisible()

> **setTargetMarkerVisible**(`visible`): `void`

Defined in: [canvas/src/primitives/types.ts:724](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/types.ts#L724)

Toggle just the target-endpoint marker. See `setBodyVisible`.

#### Parameters

##### visible

`boolean`

#### Returns

`void`
