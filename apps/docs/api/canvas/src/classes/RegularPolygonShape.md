# Class: RegularPolygonShape

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L30)

Regular n-gon centred at `(spec.x, spec.y)` with circum-radius
`spec.radius`. With `rotation = 0` the first vertex points straight up, so
a triangle / pentagon / heptagon points up by default and a hexagon is
pointy-top. Pass `rotation: Math.PI / 6` for a flat-top hexagon.

Vertices are recomputed on every `draw`. For hot paths consider caching at
the spec level — but a regular polygon's vertex count is small so the cost
is dominated by Pixi's path emission, not the trig.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)\>

## Constructors

### Constructor

> **new RegularPolygonShape**(`spec`, `host`): `RegularPolygonShape`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L33)

#### Parameters

##### spec

[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`RegularPolygonShape`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`constructor`](ShapeBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:42](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L42)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L46)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `any`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L43)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"regular-polygon"` = `'regular-polygon'`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L31)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): `Point`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:96](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L96)

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

`Point`

#### Returns

`Point`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`boundaryIntersect`](ShapeBase.md#boundaryintersect)

***

### bounds()

> **bounds**(): `Rect`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L66)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

`Rect`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:92](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L92)

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

Defined in: [canvas/src/primitives/base/ShapeBase.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L142)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L104)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L38)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L85)

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

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:100](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L100)

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:116](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L116)

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

> **visualCenter**(): `Point`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L88)

Vertices are placed symmetrically around the origin by
`regularPolygonVertices`, so the local origin is the centroid. The AABB
midpoint is offset for odd-sided polygons (triangle / pentagon /
heptagon) — using the origin instead keeps an inset glyph centred on
the visual mass rather than floating toward the apex.

#### Returns

`Point`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)

***

### boundsOf()

> `static` **boundsOf**(`spec`): `Rect`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L70)

#### Parameters

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

#### Returns

`Rect`

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L115)

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

##### anchor

`Point`

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

***

### scaleSpec()

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)\>

Defined in: [canvas/src/primitives/shapes/RegularPolygonShape.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RegularPolygonShape.ts#L74)

#### Parameters

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)\>
