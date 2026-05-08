# Class: CircleShape

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:16

Filled / stroked / icon-bearing circle. Centered at `(spec.x, spec.y)`;
the silhouette is traced in shape-local space (origin at the center).

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`CircleSpec`](../interfaces/CircleSpec.md)\>

## Constructors

### Constructor

> **new CircleShape**(`spec`, `host`): `CircleShape`

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:19

#### Parameters

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

##### host

[`ShapeHostInfo`](../interfaces/ShapeHostInfo.md)

#### Returns

`CircleShape`

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

> `protected` **spec**: [`CircleSpec`](../interfaces/CircleSpec.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:40

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"circle"` = `'circle'`

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:17

## Methods

### bounds()

> **bounds**(): [`Rect`](../interfaces/Rect.md)

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:31

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:36

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

[`CircleSpec`](../interfaces/CircleSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:24

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

[`CircleSpec`](../interfaces/CircleSpec.md)

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

> `static` **paintInto**(`g`, `spec`, `anchor`, `_angleRad`, `style?`): `void`

Defined in: packages/canvas/src/primitives/shapes/CircleShape.ts:46

Static paint surface for marker rendering. Connectors call this when
a circle is used as a source/target marker (no instantiation, just a
paint into someone else's Graphics).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`Omit`\<[`CircleSpec`](../interfaces/CircleSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### \_angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`
