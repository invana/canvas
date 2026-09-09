# Class: EllipseShape

Filled / stroked ellipse. Centred at `(spec.x, spec.y)`; the silhouette is
traced in shape-local space (origin at the centre) with independent
`radiusX` / `radiusY`. The circle's two-radius sibling — used directly, or
borrowed by [CompositeShape](CompositeShape.md) for an elliptical card body. Inset-content
fill layers (glyph / svg) are mounted centred by `ShapeBase`.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`EllipseSpec`](../interfaces/EllipseSpec.md)\>

## Constructors

### Constructor

> **new EllipseShape**(`spec`, `host`): `EllipseShape`

#### Parameters

##### spec

[`EllipseSpec`](../interfaces/EllipseSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`EllipseShape`

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

> `protected` **spec**: [`EllipseSpec`](../interfaces/EllipseSpec.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"ellipse"` = `'ellipse'`

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Analytical perimeter intersection. The ellipse is centred at its origin,
so the boundary point along the ray from `(0, 0)` toward `localFromCenter`
scales the direction so it lands on the ellipse: solve
`((t·dx)/rx)² + ((t·dy)/ry)² = 1` for `t`. Degenerate ray → `(rx, 0)`.

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

[`EllipseSpec`](../interfaces/EllipseSpec.md)

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

[`EllipseSpec`](../interfaces/EllipseSpec.md)

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

[`EllipseSpec`](../interfaces/EllipseSpec.md)

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

#### Parameters

##### spec

`Omit`\<[`EllipseSpec`](../interfaces/EllipseSpec.md), `"x"` \| `"y"`\>

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `_angleRad`, `style?`): `void`

Static paint surface for marker rendering — paints into a connector's
Graphics at `anchor` with no instantiation. Only the first solid layer of
`spec.fill` applies (markers don't support image fills / inset content).

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`EllipseSpec`](../interfaces/EllipseSpec.md), `"x"` \| `"y"`\>

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

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`EllipseSpec`](../interfaces/EllipseSpec.md)\>

#### Parameters

##### spec

`Omit`\<[`EllipseSpec`](../interfaces/EllipseSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`EllipseSpec`](../interfaces/EllipseSpec.md)\>
