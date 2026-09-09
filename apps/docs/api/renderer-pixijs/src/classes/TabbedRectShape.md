# Class: TabbedRectShape

Rectangle with a raised tab on its top edge — the manila-folder silhouette —
traced as one continuous outline so fill and stroke wrap body and tab
together.

Anchored at the top-left of the **full AABB** (the tab's top-left corner
when the tab is flush left), matching `RectShape`'s top-left convention.
`spec.height` is the body alone, so `bounds().height` is
`tabHeight + height` — callers positioning this shape place its topmost
point, not the body's.

Two details give it the folder read rather than "a rect with a box stuck on
top": the tab's inward-facing side is **angled** (`tabSkew`), and its base
is closed by a **fold line** (`tabDivider`) drawn across the body's top
edge. The fold line is interior geometry, so it is drawn only on the shape's
own paint pass — a glow or halo tracing this silhouette gets the outline
alone and doesn't sprout a stray line across the middle.

Two behaviours make it usable as a container frame:

- **`boundaryIntersect` snaps to the body, never the tab.** A connector
  drawn to this shape lands on the rectangle a reader perceives as the
  object; a line terminating on the little tab reads as a mistake.
- **`labelAnchorBox` routes inside labels into the tab.** So
  `placement: 'inside-center'` puts the title on the tab, independent of
  how large the body grows — which is what makes an auto-sized frame's
  title stay put.

`height: 0` draws the **tab by itself** — the closed folder. The tab's base
becomes the outline's bottom edge (filleted, no fold line), the taper still
applies, and bounds / label box / edge anchors all collapse onto the tab.
That's the silhouette a collapsed container frame renders as.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

## Constructors

### Constructor

> **new TabbedRectShape**(`spec`, `host`): `TabbedRectShape`

#### Parameters

##### spec

[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`TabbedRectShape`

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

> `protected` **spec**: [`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"tabbed-rect"` = `'tabbed-rect'`

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): [`Point`](../interfaces/Point.md)

Ray exit against the **body** rectangle only. Input and output are
relative to the AABB centre per the `IShape` contract, so the body is
expressed as an off-centre box: the tab band sits entirely above the
AABB centre line, shifting the body's top edge down by `tabHeight / 2`.

Excluding the tab is deliberate — a connector should terminate on the
container's body, not on the little title flag above it. The one exception
is a bodyless spec (`height <= 0`, the closed folder): with no body to aim
at, the tab band becomes the target.

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

[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)

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

[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)

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

### labelAnchorBox()

> **labelAnchorBox**(`placement`): [`Rect`](../interfaces/Rect.md)

Route every `inside-*` placement into the **tab**.

The rule is one-line on purpose: this silhouette exists to be a frame
around *other* content, so its body interior belongs to whatever it
contains — the only place the shape's own label belongs is the tab.
`inside-center` therefore centres the title on the tab, `inside-left`
left-aligns it there, and so on: the placement still means what it says,
just against the tab's box rather than the body's.

The box returned is the tab's **upright** portion — the slant is excluded
on whichever side is angled, so a centred title reads centred against the
part of the tab that's actually full height rather than drifting into the
taper. Because that box is small and fixed, the inside-placement inset
(proportional to the box) stays visually identical no matter how large the
body grows underneath.

Two deliberate escapes: bare `'center'` resolves through
[visualCenter](#visualcenter) to the **body** centre, and the outside placements
fall through to the full AABB so they clear the whole silhouette.

#### Parameters

##### placement

[`ShapeLabelPlacement`](../type-aliases/ShapeLabelPlacement.md)

#### Returns

[`Rect`](../interfaces/Rect.md)

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

[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)

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

The body's midpoint, not the AABB's — the tab band shifts the AABB
centre upward by `tabHeight / 2`, which would float a centred glyph or
label off the rectangle the eye reads as the object.

With no body (`height <= 0`) the tab *is* the object, so its own midpoint
is the answer.

#### Returns

[`Point`](../interfaces/Point.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`visualCenter`](ShapeBase.md#visualcenter)

***

### boundsOf()

> `static` **boundsOf**(`spec`): [`Rect`](../interfaces/Rect.md)

#### Parameters

##### spec

`Omit`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md), `"x"` \| `"y"`\>

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### collapsedOf()

> `static` **collapsedOf**(`spec`): `Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

The folder, closed: body gone, tab kept.

#### Parameters

##### spec

`Omit`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md), `"x"` \| `"y"`\>

#### Returns

`Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

***

### fitToContent()

> `static` **fitToContent**(`spec`, `content`): `Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

Size the tab to the title it carries.

#### Parameters

##### spec

`Omit`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md), `"x"` \| `"y"`\>

##### content

###### height

`number`

###### width

`number`

#### Returns

`Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`): `void`

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md), `"x"` \| `"y"`\>

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

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>

#### Parameters

##### spec

`Omit`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`TabbedRectSpec`](../interfaces/TabbedRectSpec.md)\>
