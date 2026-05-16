# Class: ArrowMarker

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:70](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L70)

Base for shapes whose `draw` and `paintInto` share a single silhouette
trace. Subclasses implement `drawGeometry` (trace path + apply fill +
apply stroke) and `bounds`. They get `draw` and `paintInto` for free.

The shape's root `gfx` Container holds:
  - `bodyGfx`     — Graphics drawing the silhouette + silhouette-filler
                    fill layers (`solid` / `image`) + border.
  - inset views   — sibling Containers, one per inset-content fill layer
                    (`glyph` / `svg` / `image-inset`), keyed by layer
                    index in `spec.fill`.

Decorations operate against `paintInto` — a callback into the silhouette
only, never into inset content. This means a glow on a shape with an icon
halos the silhouette but leaves the glyph alone.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)\>

## Constructors

### Constructor

> **new ArrowMarker**(`spec`, `host`): `ArrowMarker`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:73](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L73)

#### Parameters

##### spec

[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`ArrowMarker`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`constructor`](ShapeBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: `Graphics`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:42](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L42)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:46](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L46)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### insetViews

> `protected` `readonly` **insetViews**: `any`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:43](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L43)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`insetViews`](ShapeBase.md#insetviews)

***

### spec

> `protected` **spec**: [`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"arrow"` = `'arrow'`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:71](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L71)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:130](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L130)

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

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:85](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L85)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:141](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L141)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:104](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L104)

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:78](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L78)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### getHitArea()

> **getHitArea**(): `IHitArea`

Defined in: [canvas/src/primitives/base/ShapeBase.ts:85](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L85)

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

Defined in: [canvas/src/primitives/base/ShapeBase.ts:115](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L115)

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

Defined in: [canvas/src/primitives/base/ShapeBase.ts:156](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/ShapeBase.ts#L156)

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

### markerInset()

> `static` **markerInset**(`spec`, `strokeWidth?`): `number`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:98](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L98)

Distance from the arrow tip back to the base along the negative tangent.
The connector trims its body by this amount so the line stops at the
marker's base — the marker triangle then visually starts where the line
ends and its tip reaches the original anchor (target endpoint).

#### Parameters

##### spec

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

##### strokeWidth?

`number` = `1`

#### Returns

`number`

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`, `strokeWidth?`): `void`

Defined in: [canvas/src/primitives/markers/ArrowMarker.ts:105](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/markers/ArrowMarker.ts#L105)

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

##### strokeWidth?

`number` = `1`

#### Returns

`void`
