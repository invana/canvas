# Interface: ShapeCtor\<TSpec\>

Defined in: [canvas/src/primitives/types.ts:976](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L976)

Constructor type for shapes registered via `registerShape`. Optionally
exposes a `static paintInto` so the shape can also serve as a connector
marker. Shapes without `paintInto` cannot be used as markers.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Constructors

### Constructor

> **new ShapeCtor**(`spec`, `host`): [`IShape`](IShape.md)\<`TSpec`\>

Defined in: [canvas/src/primitives/types.ts:977](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L977)

#### Parameters

##### spec

`TSpec`

##### host

[`ShapeHostInfo`](ShapeHostInfo.md)

#### Returns

[`IShape`](IShape.md)\<`TSpec`\>

## Properties

### boundsOf?

> `readonly` `optional` **boundsOf?**: (`spec`) => [`Rect`](Rect.md)

Defined in: [canvas/src/primitives/types.ts:1030](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1030)

Optional static AABB reporter. Returns the shape's bounding box in
*local* (centre-relative) coordinates — `spec.x` / `spec.y` are
ignored, so the same value can be reused for any positioned instance.

Lets consumers (minimap footprint estimation, layouts that need node
sizes, label-collision pre-pass) query a registered shape's size from
the spec alone without instantiating the shape or its Pixi `Graphics`.
Shapes that don't implement this expose `undefined` from
[PrimitivesRenderer.boundsOfSpec](../classes/PrimitivesRenderer.md#boundsofspec); consumers fall back to a
default size.

Built-in shapes' instance `bounds()` delegates to this static so the
geometry isn't duplicated.

#### Parameters

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

#### Returns

[`Rect`](Rect.md)

***

### markerInset?

> `readonly` `optional` **markerInset?**: (`spec`, `strokeWidth?`) => `number`

Defined in: [canvas/src/primitives/types.ts:1014](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1014)

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

Defined in: [canvas/src/primitives/types.ts:991](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L991)

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

***

### scaleSpec?

> `readonly` `optional` **scaleSpec?**: (`spec`, `factor`) => `Partial`\<`TSpec`\>

Defined in: [canvas/src/primitives/types.ts:1050](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/types.ts#L1050)

Optional uniform-scale operator. Returns a partial spec that resizes
the shape's geometry by `factor` while preserving its aspect ratio,
angular range, and any other shape-specific invariants. Paint
channels (`fill` / `stroke` / `alpha`) and position (`x` / `y`) are
not the shape's concern — callers compose them onto the result.

The contract: `boundsOf(scaleSpec(spec, k)).width ==
boundsOf(spec).width * k` (likewise for height). I.e. uniform
scaling is exact for the AABB. Internal layout (a star's
inner/outer ratio, an arc's angular sweep, a polygon's vertex
topology) is preserved.

Used by `NodeSizeLODBehaviour` to rewrite shape size as the camera
zooms, without switching over a closed kind enum. Shapes that don't
implement this expose `undefined` from
[PrimitivesRenderer.scaleShapeSpec](../classes/PrimitivesRenderer.md#scaleshapespec); the LOD behaviour skips
those nodes.

#### Parameters

##### spec

`Omit`\<`TSpec`, `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<`TSpec`\>
