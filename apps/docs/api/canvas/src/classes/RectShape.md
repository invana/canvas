# Class: RectShape

Defined in: [canvas/src/primitives/shapes/RectShape.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L19)

Axis-aligned rectangle with optional `cornerRadius`. Anchored at its
top-left corner in shape-local space; `(spec.x, spec.y)` is the world
position of that corner. A "square" is just `RectShape` with
`width === height` and no `cornerRadius`.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`RectSpec`](../interfaces/RectSpec.md)\>

## Constructors

### Constructor

> **new RectShape**(`spec`, `host`): `RectShape`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L22)

#### Parameters

##### spec

[`RectSpec`](../interfaces/RectSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`RectShape`

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

> `protected` **spec**: [`RectSpec`](../interfaces/RectSpec.md)

Defined in: [canvas/src/primitives/base/ShapeBase.ts:44](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeBase.ts#L44)

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"rect"` = `'rect'`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L20)

## Methods

### boundaryIntersect()

> **boundaryIntersect**(`localFromCenter`): `Point`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:91](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L91)

Silhouette-aware ray exit. For `cornerRadius > 0` the AABB face isn't
the actual outline — the rendered rect rounds inward at each corner.
Take the AABB exit first; if it falls in one of the four corner zones
(within `R` of a corner in both axes), re-cast the ray against that
corner's quarter-circle so the returned point sits on the visible
silhouette. For sharp rects this is unchanged from the AABB fallback.

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

Defined in: [canvas/src/primitives/shapes/RectShape.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L60)

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

`Rect`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L76)

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

[`RectSpec`](../interfaces/RectSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L27)

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

`Graphics`

##### spec

[`RectSpec`](../interfaces/RectSpec.md)

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

***

### boundsOf()

> `static` **boundsOf**(`spec`): `Rect`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L64)

#### Parameters

##### spec

`Omit`\<[`RectSpec`](../interfaces/RectSpec.md), `"x"` \| `"y"`\>

#### Returns

`Rect`

***

### paintInto()

> `static` **paintInto**(`g`, `spec`, `anchor`, `_angleRad`, `style?`): `void`

Defined in: [canvas/src/primitives/shapes/RectShape.ts:131](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L131)

#### Parameters

##### g

`Graphics`

##### spec

`Omit`\<[`RectSpec`](../interfaces/RectSpec.md), `"x"` \| `"y"`\>

##### anchor

`Point`

##### \_angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

***

### scaleSpec()

> `static` **scaleSpec**(`spec`, `factor`): `Partial`\<[`RectSpec`](../interfaces/RectSpec.md)\>

Defined in: [canvas/src/primitives/shapes/RectShape.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/shapes/RectShape.ts#L68)

#### Parameters

##### spec

`Omit`\<[`RectSpec`](../interfaces/RectSpec.md), `"x"` \| `"y"`\>

##### factor

`number`

#### Returns

`Partial`\<[`RectSpec`](../interfaces/RectSpec.md)\>
