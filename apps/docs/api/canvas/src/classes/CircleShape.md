# Class: CircleShape

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:18](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L18)

Filled / stroked circle. Centered at `(spec.x, spec.y)`; the silhouette
is traced in shape-local space (origin at the center). Inset-content fill
layers (glyph / svg / image-inset) are mounted as sibling Containers by
`ShapeBase` — they appear centred (or anchored) inside the circle.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`CircleSpec`](../interfaces/CircleSpec.md)\>

## Constructors

### Constructor

> **new CircleShape**(`spec`, `host`): `CircleShape`

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:21](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L21)

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

> `protected` `readonly` **bodyGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:42](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L42)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:46](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L46)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `any`

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:43](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L43)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`CircleSpec`](../interfaces/CircleSpec.md)

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"circle"` = `'circle'`

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:19](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L19)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:53](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L53)

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

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:35](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L35)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:40](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L40)

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

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:103](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L103)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:66](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L66)

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

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:26](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L26)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### obstacleTest()

> **obstacleTest**(): (`worldX`, `worldY`, `inflate`) => `boolean`

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:66](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L66)

Silhouette obstacle-test for routers. Returns a closure over the
circle's current `(centre, radius)` that tests world points against
the inflated disc — pixel-tight, not the AABB-square. Routes hug the
circle's tangent instead of avoiding its bounding box corners.

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/base/ShapeBase.ts:77](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/base/ShapeBase.ts#L77)

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

[`Graphics`](../interfaces/Graphics.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`paintInto`](ShapeBase.md#paintinto)

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `_angleRad`, `style?`): `void`

Defined in: [packages/canvas/src/primitives/shapes/CircleShape.ts:85](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/shapes/CircleShape.ts#L85)

Static paint surface for marker rendering. Connectors call this when
a circle is used as a source/target marker (no instantiation, just a
paint into someone else's Graphics). Only the first solid layer of
`spec.fill` is honoured here — markers don't support image fills or
inset content.

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

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
