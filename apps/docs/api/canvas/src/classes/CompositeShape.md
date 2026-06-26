# Class: CompositeShape

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L104)

A container shape: an outer rounded-rect frame plus an ordered list of child
[CompositePart](../type-aliases/CompositePart.md)s — `rect` / `circle` / `line` geometry traced into the
shared body `Graphics`, and `label` text blocks mounted as Pixi text children
— each positioned at a coordinate relative to the composite's top-left origin
(so `(spec.x, spec.y)` places the whole composite, like [RectShape](RectShape.md)).

Mounting text children mirrors how [ShapeBase](ShapeBase.md) mounts glyph / svg /
image insets onto the shape's root container; labels here are diffed by
their index in `parts` (mount / update-in-place / destroy).

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`CompositeSpec`](../interfaces/CompositeSpec.md)\>

## Constructors

### Constructor

> **new CompositeShape**(`spec`, `host`): `CompositeShape`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:110](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L110)

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

> `protected` **spec**: [`CompositeSpec`](../interfaces/CompositeSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"composite"` = `'composite'`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:105](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L105)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): `Point`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:131](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L131)

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

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`boundaryIntersect`](ShapeBase.md#boundaryintersect)

***

### bounds()

> **bounds**(): `Rect`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:212](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L212)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

`Rect`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:216](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L216)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L150)

Geometry via the base `draw`, then reconcile the text-label children.

#### Parameters

##### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`): `void`

Defined in: [canvas/src/primitives/shapes/CompositeShape.ts:115](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/CompositeShape.ts#L115)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

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

Defined in: [canvas/src/primitives/base/ShapeBase.ts:157](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L157)

Visual centre — the point inset content with `anchor: 'center'` snaps
to. Default is the AABB midpoint of `bounds()`, which is correct for
`CircleShape` (bounds is centred on origin) and `RectShape` (bounds is
the rect itself). Shapes whose silhouette doesn't fill its AABB —
triangle, hexagon, star, free-form polygon — override to return the
geometric centroid so a glyph drawn on a triangle sits on the visual
centroid instead of floating above it.

#### Returns

`Point`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)
