# Class: CircleShape

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:19](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L19)

Filled / stroked circle. Centered at `(spec.x, spec.y)`; the silhouette
is traced in shape-local space (origin at the center). Inset-content fill
layers (glyph / svg / svg-url) are mounted as sibling Containers by
`ShapeBase` — they appear centred (or anchored) inside the circle.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`CircleSpec`](../interfaces/CircleSpec.md)\>

## Constructors

### Constructor

> **new CircleShape**(`spec`, `host`): `CircleShape`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:22](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L22)

#### Parameters

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`CircleShape`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`constructor`](ShapeBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:42](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L42)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:46](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L46)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `any`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L43)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`CircleSpec`](../interfaces/CircleSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"circle"` = `'circle'`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:20](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L20)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:88](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L88)

Analytical perimeter intersection. `CircleShape` is centred at its
origin, so "centre-relative" and "origin-relative" local coords are the
same here. The boundary point along the ray from `(0, 0)` toward
`localFromCenter` is just the unit vector scaled by the radius.
When `localFromCenter` coincides with the centre the ray is degenerate;
we return `(r, 0)` as a stable sentinel.

#### Parameters

##### localFromCenter

[`Point`](../interfaces/Point.md)

#### Returns

[`Point`](../interfaces/Point.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`boundaryIntersect`](ShapeBase.md#boundaryintersect)

***

### bounds()

> **bounds**(): [`Rect`](../interfaces/Rect.md)

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:62](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L62)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:75](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L75)

#### Parameters

##### localX

`number`

##### localY

`number`

#### Returns

`boolean`

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:142](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L142)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:104](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L104)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:27](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L27)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:85](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L85)

Hit-test region for this shape, derived from [drawGeometry](#drawgeometry).

Default behaviour: the returned `IHitArea`'s `contains(x, y)` delegates
to `bodyGfx.containsPoint({ x, y })`. Because `drawGeometry` is the
single function that paints the silhouette into `bodyGfx` (see
[draw](#draw)), the hit region tracks the rendered silhouette exactly —
including any stroke (Pixi's `containsPoint` uses `strokeContains` for
stroke instructions, with a half-stroke-width tolerance).

The returned object is stable across `draw()` calls: the closure reads
`bodyGfx` by reference, so subsequent `drawGeometry` repaints
automatically update the hit region. No re-wiring of `gfx.hitArea`.

Subclasses with cheap analytical hit tests — `CircleShape`
(`x² + y² ≤ r²`), `RectShape` (AABB) — may override to skip Pixi's
path-walk on hot paths. Keep the contract: input is shape-local
coordinates; `true` iff the point is inside the silhouette.

#### Returns

`IHitArea`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`getHitArea`](ShapeBase.md#gethitarea)

***

### obstacleTest()

> **obstacleTest**(): (`worldX`, `worldY`, `inflate`) => `boolean`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:101](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L101)

Silhouette obstacle-test for routers. Returns a closure over the
circle's current `(centre, radius)` that tests world points against
the inflated disc — pixel-tight, not the AABB-square. Routes hug the
circle's tangent instead of avoiding its bounding box corners.

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:116](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L116)

Decoration entry point — repaint the silhouette into someone else's
`Graphics` with a style override. The shape uses its own current spec;
decorations don't pass one. (Distinct from `ShapeCtor.paintInto` —
the static method markers use, which takes an explicit spec + anchor.)

Optional for back-compat: `TextShape` (and similar non-silhouette shapes)
may omit it. Decorations check for presence before calling and silently
skip when absent (text labels just won't have glow / halo applied).
Every shape that extends `ShapeBase` has it for free.

#### Parameters

##### g

`Graphics`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`paintInto`](ShapeBase.md#paintinto)

***

### visualCenter()

> **visualCenter**(): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:157](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeBase.ts#L157)

Visual centre — the point inset content with `anchor: 'center'` snaps
to. Default is the AABB midpoint of `bounds()`, which is correct for
`CircleShape` (bounds is centred on origin) and `RectShape` (bounds is
the rect itself). Shapes whose silhouette doesn't fill its AABB —
triangle, hexagon, star, free-form polygon — override to return the
geometric centroid so a glyph drawn on a triangle sits on the visual
centroid instead of floating above it.

#### Returns

[`Point`](../interfaces/Point.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)

***

### boundsOf()

> `static` **boundsOf**(`spec`): [`Rect`](../interfaces/Rect.md)

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L66)

#### Parameters

##### spec

`Omit`\<[`CircleSpec`](../interfaces/CircleSpec.md), `"x"` \| `"y"`\>

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `_angleRad`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:120](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L120)

Static paint surface for marker rendering. Connectors call this when
a circle is used as a source/target marker (no instantiation, just a
paint into someone else's Graphics). Only the first solid layer of
`spec.fill` is honoured here — markers don't support image fills or
inset content.

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`CircleSpec`](../interfaces/CircleSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### \_angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

***

### scaleSpec()

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`CircleSpec`](../interfaces/CircleSpec.md)\>

Defined in: [canvas/src/primitives/shapes/CircleShape.ts:71](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/shapes/CircleShape.ts#L71)

#### Parameters

##### spec

`Omit`\<[`CircleSpec`](../interfaces/CircleSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`CircleSpec`](../interfaces/CircleSpec.md)\>
