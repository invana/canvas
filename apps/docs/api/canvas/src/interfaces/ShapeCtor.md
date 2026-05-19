# Interface: ShapeCtor\<TSpec\>

Defined in: [canvas/src/primitives/types.ts:884](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L884)

Constructor type for shapes registered via `registerShape`. Optionally
exposes a `static paintInto` so the shape can also serve as a connector
marker. Shapes without `paintInto` cannot be used as markers.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Constructors

### Constructor

> **new ShapeCtor**(`spec`, `host`): [`IShape`](IShape.md)\<`TSpec`\>

Defined in: [canvas/src/primitives/types.ts:885](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L885)

#### Parameters

##### spec

`TSpec`

##### host

[`ShapeHostInfo`](ShapeHostInfo.md)

#### Returns

[`IShape`](IShape.md)\<`TSpec`\>

## Properties

### markerInset?

> `readonly` `optional` **markerInset?**: (`spec`, `strokeWidth?`) => `number`

Defined in: [canvas/src/primitives/types.ts:922](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L922)

Optional marker-inset reporter. When this shape is used as a connector
marker, returns how far back from the anchor (along the negative tangent)
the marker's "back edge" sits — i.e. how much the connector body must
be trimmed so it stops where the marker visually begins.

For an arrow this is the tip-to-base length; for a circle / diamond /
square it would be the half-extent along the tangent. Shapes without a
meaningful back edge (or that should not affect line trimming) omit this
and the connector treats the inset as `0`.

`strokeWidth` mirrors `paintInto` — markers that derive size from the
connector's stroke width (e.g. arrows with `lengthScale`) read it here
so the trim and the painted marker agree on geometry.

#### Parameters

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

##### strokeWidth?

`number`

#### Returns

`number`

***

### paintInto?

> `readonly` `optional` **paintInto?**: (`g`, `spec`, `anchor`, `angleRad`, `style?`, `strokeWidth?`) => `void`

Defined in: [canvas/src/primitives/types.ts:899](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L899)

Optional static paint surface for marker rendering. Connectors call
this to paint a marker at a polyline endpoint without instantiating
the shape. The spec's `x` / `y` are ignored — the caller supplies
position via `anchor`. When `style` is supplied, the shape's spec
colors are overridden (used by glow/halo to tint markers).

`strokeWidth` is the host connector's resolved stroke width in pixels.
Marker shapes that scale with the line (e.g. `ArrowMarker` derives its
length and base width from multipliers × strokeWidth) read this. When
the shape is rendered standalone (not as a connector marker), pass `1`
or omit; the marker shape should fall back to a sensible default.

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

##### anchor

[`Point`](Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](ShapePaintStyle.md)

##### strokeWidth?

`number`

#### Returns

`void`
