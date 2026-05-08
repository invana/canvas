# Abstract Class: ShapeBase\<TSpec\>

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:34

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

- [`PrimitiveBase`](PrimitiveBase.md)

## Extended by

- [`CircleShape`](CircleShape.md)
- [`RectShape`](RectShape.md)
- [`ArrowMarker`](ArrowMarker.md)

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

## Implements

- [`IShape`](../interfaces/IShape.md)\<`TSpec`\>

## Constructors

### Constructor

> **new ShapeBase**\<`TSpec`\>(`host`): `ShapeBase`\<`TSpec`\>

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:42

#### Parameters

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`ShapeBase`\<`TSpec`\>

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`constructor`](PrimitiveBase.md#constructor)

## Properties

### bodyGfx

> `protected` `readonly` **bodyGfx**: [`Graphics`](../interfaces/Graphics.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:38

***

### gfx

> `readonly` **gfx**: `Container`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:12

Root display object — renderer adds/removes this on the host surface.

#### Implementation of

[`IShape`](../interfaces/IShape.md).[`gfx`](../interfaces/IShape.md#gfx)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` `readonly` **host**: [`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:42

***

### iconView

> `protected` **iconView**: `IconView` = `null`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:39

***

### spec

> `protected` **spec**: `TSpec`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:40

## Methods

### bounds()

> `abstract` **bounds**(): [`Rect`](../interfaces/Rect.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:60

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IShape`](../interfaces/IShape.md).[`bounds`](../interfaces/IShape.md#bounds)

***

### destroy()

> **destroy**(): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:77

#### Returns

`void`

#### Implementation of

[`IShape`](../interfaces/IShape.md).[`destroy`](../interfaces/IShape.md#destroy)

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### draw()

> **draw**(`spec`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:62

(Re)paint the shape from the current spec. Called on add and on update.

#### Parameters

##### spec

`TSpec`

#### Returns

`void`

#### Implementation of

[`IShape`](../interfaces/IShape.md).[`draw`](../interfaces/IShape.md#draw)

***

### drawGeometry()

> `abstract` `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:54

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`TSpec`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`

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

#### Implementation of

[`IShape`](../interfaces/IShape.md).[`paintInto`](../interfaces/IShape.md#paintinto)
