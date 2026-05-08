# Class: ArrowMarker

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:43

Base for shapes whose `draw` and `paintInto` share a single silhouette
trace. Subclasses implement `drawGeometry` (trace path + apply fill +
apply stroke) and `bounds`. They get `draw` and `paintInto` for free.

The shape's root `gfx` Container holds two layers:
  - `bodyGfx`  — Graphics drawing the silhouette + body fill + border
  - `iconView` — sibling Container holding an icon glyph, when
                 `spec.fill.kind === 'icon'`. Wired in step 4 (paint
                 helpers), not here — at step 3 the iconView property is
                 declared but unused.

Decorations operate against `paintInto` — a callback into the silhouette
only, never into the icon view. This means a glow on a shape with an icon
halos the silhouette but leaves the glyph alone.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)\>

## Constructors

### Constructor

> **new ArrowMarker**(`spec`, `host`): `ArrowMarker`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:46

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

> `protected` `readonly` **bodyGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:38

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`bodyGfx`](ShapeBase.md#bodygfx)

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:12

Root display object — renderer adds/removes this on the host surface.

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`gfx`](ShapeBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:42

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`host`](ShapeBase.md#host)

***

### iconView

> `protected` **iconView**: `IconView` = `null`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:39

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`iconView`](ShapeBase.md#iconview)

***

### spec

> `protected` **spec**: [`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:40

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"arrow"` = `'arrow'`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:44

## Methods

### bounds()

> **bounds**(): [`Rect`](../interfaces/Rect.md)

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:55

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### destroy()

> **destroy**(): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:77

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`destroy`](ShapeBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:62

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

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:51

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md)

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

#### Overrides

[`ShapeBase`](ShapeBase.md).[`drawGeometry`](ShapeBase.md#drawgeometry)

***

### paintInto()

> **paintInto**(`g`, `style?`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:73

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

> `static` **paintInto**(`g`, `spec`, `anchor`, `angleRad`, `style?`): `void`

Defined in: packages/canvas/src/primitives/markers/ArrowMarker.ts:61

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`Omit`\<[`ArrowMarkerSpec`](../interfaces/ArrowMarkerSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`
