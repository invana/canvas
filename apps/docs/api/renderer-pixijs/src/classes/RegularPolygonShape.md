# Class: RegularPolygonShape

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

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `Map`\<`number`, `InsetContentView`\>

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"regular-polygon"` = `'regular-polygon'`

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

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

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

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

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

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

Hit-test region for this shape, derived from [drawGeometry](#drawgeometry).

**No longer the picking path for built-in kinds** — `hitTest`'s narrow
phase answers from the spec (`containsSpec` in `specs/shapeGeometry/`), so
picking needs no display object and both backends agree. This stays as the
pixi `gfx.hitArea` wiring, and as the fallback for `registerShape` kinds
the spec geometry has never heard of.

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

#### Returns

(`worldX`, `worldY`, `inflate`) => `boolean`

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

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

### setGeometrySpec()

> **setGeometrySpec**(`spec`): `void`

Update the spec used by [paintInto](#paintinto-1) / [bounds](#bounds) / [contains](#contains)
**without** drawing this shape's own `gfx`. For *container* shapes (e.g.
[CompositeShape](CompositeShape.md)) that compose another shape purely as a silhouette
provider — they trace the borrowed shape into their *own* graphics via
`paintInto`, so the borrowed instance's `gfx` must stay untouched. Regular
rendering goes through [draw](#draw), not this.

#### Parameters

##### spec

[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`setGeometrySpec`](ShapeBase.md#setgeometryspec)

***

### setImageFillVisible()

> **setImageFillVisible**(`visible`): `void`

Toggle the silhouette `image` fill. Unlike icons, an image is painted
*into* the body, so hiding it repaints the body with `image` layers
stripped (solid fills / borders / other layers untouched). The flag
persists across [draw](#draw). No-op when the state is unchanged.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`setImageFillVisible`](ShapeBase.md#setimagefillvisible)

***

### setInsetContentVisible()

> **setInsetContentVisible**(`visible`): `void`

Toggle inset-content (`glyph` / `svg` / `svg-url` icon) visibility. A pure
`.visible` flip on the inset containers — no repaint. The flag persists, so
a later [draw](#draw) keeps icons hidden until re-shown. Zoom-visibility LOD
uses this to drop icons at low zoom without touching the body.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`setInsetContentVisible`](ShapeBase.md#setinsetcontentvisible)

***

### visualCenter()

> **visualCenter**(): [`Point`](../interfaces/Point.md)

Vertices are placed symmetrically around the origin by
`regularPolygonVertices`, so the local origin is the centroid. The AABB
midpoint is offset for odd-sided polygons (triangle / pentagon /
heptagon) — using the origin instead keeps an inset glyph centred on
the visual mass rather than floating toward the apex.

#### Returns

[`Point`](../interfaces/Point.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)

***

### boundsOf()

> `static` **boundsOf**(`spec`): [`Rect`](../interfaces/Rect.md)

#### Parameters

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`): `void`

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

***

### scaleSpec()

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)\>

#### Parameters

##### spec

`Omit`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`RegularPolygonSpec`](../interfaces/RegularPolygonSpec.md)\>
