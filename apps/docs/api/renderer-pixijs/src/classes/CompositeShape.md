# Class: CompositeShape

A container shape: a **root** background shape plus an ordered list of child
[CompositePart](../type-aliases/CompositePart.md)s — `rect` / `circle` / `line` geometry traced into the
shared body `Graphics`, and `label` text blocks mounted as Pixi text children
— each positioned relative to the composite's top-left origin (so
`(spec.x, spec.y)` places the whole composite, like [RectShape](RectShape.md)).

The composite owns **no** silhouette geometry of its own: it borrows a real
shape instance ([CompositeRootSpec](../type-aliases/CompositeRootSpec.md)) and traces it via `paintInto`, so
fill, stroke, hit-testing and every decoration (ring / glow / halo) follow the
root shape automatically — a circular card gets a circular halo for free.

Mounting text children mirrors how [ShapeBase](ShapeBase.md) mounts glyph / svg /
image insets onto the shape's root container; labels here are diffed by
their index in `parts` (mount / update-in-place / destroy).

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`CompositeSpec`](../interfaces/CompositeSpec.md)\>

## Constructors

### Constructor

> **new CompositeShape**(`spec`, `host`): `CompositeShape`

#### Parameters

##### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`CompositeShape`

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

> `protected` **spec**: [`CompositeSpec`](../interfaces/CompositeSpec.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"composite"` = `'composite'`

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

#### Inherited from

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

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Refresh the root shape, geometry via the base `draw`, then labels + icons.

#### Parameters

##### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

#### Returns

`void`

#### Overrides

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

[`CompositeSpec`](../interfaces/CompositeSpec.md)

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

### hitTestPart()

> **hitTestPart**(`localX`, `localY`): `string`

Sub-part hit test — returns the `hitId` of the topmost `hitId`-tagged part
(`rect` / `circle` / `icon`) containing the local point, or `undefined`.
Parts are traced back-to-front, so the search runs in reverse (last drawn =
on top). The renderer calls this to emit `shape:partover` / `shape:partout`.

#### Parameters

##### localX

`number`

##### localY

`number`

#### Returns

`string`

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

Update the spec used by [paintInto](#paintinto) / [bounds](#bounds) / contains
**without** drawing this shape's own `gfx`. For *container* shapes (e.g.
CompositeShape) that compose another shape purely as a silhouette
provider — they trace the borrowed shape into their *own* graphics via
`paintInto`, so the borrowed instance's `gfx` must stay untouched. Regular
rendering goes through [draw](#draw), not this.

#### Parameters

##### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

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

### setLabelResolution()

> **setLabelResolution**(`resolution`): `void`

Re-rasterise every mounted `label` part at `resolution` (device pixels per
CSS pixel) and remember it, so subsequent redraws keep the text crisp. The
renderer calls this from its label-resolution LOD path — the composite
counterpart to a `LabelDecoration.setResolution`.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setTextVisible()

> **setTextVisible**(`visible`): `void`

Show / hide every mounted `label` part — the composite's internal text.
A pure `.visible` flip; the flag persists so a later redraw keeps text
hidden (syncLabels re-asserts it). This is the `IShape.setTextVisible`
hook the renderer's text zoom-LOD path drives, so a `TextLODBehaviour` gates
composite text the same way it gates a simple node's `'label'` decoration.

#### Parameters

##### visible

`boolean`

#### Returns

`void`

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

Static AABB from the spec's `width × height` box — the composite's silhouette
fills its box (like [RectShape](RectShape.md)). Exposed so `PrimitivesRenderer.boundsOfSpec`
can size a composite **without** an instance, which is how layouts (ELK et al.)
read node dimensions. Missing this made every card fall back to the layout's
default size and overlap.

#### Parameters

##### spec

`Pick`\<[`CompositeSpec`](../interfaces/CompositeSpec.md), `"width"` \| `"height"`\>

#### Returns

[`Rect`](../interfaces/Rect.md)
