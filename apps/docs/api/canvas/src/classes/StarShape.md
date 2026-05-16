# Class: StarShape

Defined in: [canvas/src/primitives/shapes/StarShape.ts:28](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L28)

N-pointed star centred at `(spec.x, spec.y)`. `points` controls the number
of outer tips; vertices alternate between `outerRadius` and `innerRadius`.
With `rotation = 0` the first outer tip points straight up. The silhouette
is concave by construction — the bisector-based `offsetPolygon` inset is
an approximation for thin / decorative insets only; deep insets may
self-intersect.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`StarSpec`](../interfaces/StarSpec.md)\>

## Constructors

### Constructor

> **new StarShape**(`spec`, `host`): `StarShape`

Defined in: [canvas/src/primitives/shapes/StarShape.ts:31](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L31)

#### Parameters

##### spec

[`StarSpec`](../interfaces/StarSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`StarShape`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`constructor`](ShapeBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:42](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L42)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:46](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L46)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `any`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:43](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L43)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`StarSpec`](../interfaces/StarSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"star"` = `'star'`

Defined in: [canvas/src/primitives/shapes/StarShape.ts:29](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L29)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/shapes/StarShape.ts:78](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L78)

Default boundary intersection: ray from the shape's geometric centre
`(0, 0)` toward `localFromCenter`, intersected with a centred AABB
derived from `this.bounds()`. Correct for `RectShape` (anchored
top-left) and any shape whose silhouette can be approximated by its
bounding box.

Geometric shapes with non-rectangular silhouettes (`CircleShape`,
`EllipseShape`, `PolygonShape`) should override this for pixel-accurate
perimeter snapping. Input and output are both centre-relative.

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

Defined in: [canvas/src/primitives/shapes/StarShape.ts:59](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L59)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: [canvas/src/primitives/shapes/StarShape.ts:74](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L74)

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

Defined in: [canvas/src/primitives/base/ShapeBase.ts:141](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L141)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:104](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L104)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

[`StarSpec`](../interfaces/StarSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/StarShape.ts:36](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L36)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`StarSpec`](../interfaces/StarSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:85](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L85)

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

Defined in: [canvas/src/primitives/shapes/StarShape.ts:82](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L82)

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:115](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeBase.ts#L115)

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

Defined in: [canvas/src/primitives/shapes/StarShape.ts:70](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L70)

Star vertices are placed symmetrically around the origin by
`starVertices`, so the local origin is the centroid. For odd-pointed
stars (5-point being the canonical case) the AABB midpoint is offset
from the visual mass — using the origin instead keeps an inset glyph
sitting where the eye reads as "centre".

#### Returns

[`Point`](../interfaces/Point.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/StarShape.ts:97](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/shapes/StarShape.ts#L97)

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`StarSpec`](../interfaces/StarSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`
