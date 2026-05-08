# Class: RectShape

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:18

Axis-aligned rectangle with optional `cornerRadius`. Anchored at its
top-left corner in shape-local space; `(spec.x, spec.y)` is the world
position of that corner. A "square" is just `RectShape` with
`width === height` and no `cornerRadius`.

## Extends

- [`ShapeBase`](ShapeBase.md)\<[`RectSpec`](../interfaces/RectSpec.md)\>

## Constructors

### Constructor

> **new RectShape**(`spec`, `host`): `RectShape`

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:21

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

> `protected` **spec**: [`RectSpec`](../interfaces/RectSpec.md)

Defined in: packages/canvas/src/primitives/base/ShapeBase.ts:40

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`spec`](ShapeBase.md#spec)

***

### kind

> `readonly` `static` **kind**: `"rect"` = `'rect'`

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:19

## Methods

### bounds()

> **bounds**(): [`Rect`](../interfaces/Rect.md)

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:39

Local-space axis-aligned bounding box for hit-testing & decorations.

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Overrides

[`ShapeBase`](ShapeBase.md).[`bounds`](ShapeBase.md#bounds)

***

### contains()

> **contains**(`localX`, `localY`): `boolean`

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:43

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

[`RectSpec`](../interfaces/RectSpec.md)

#### Returns

`void`

#### Inherited from

[`ShapeBase`](ShapeBase.md).[`draw`](ShapeBase.md#draw)

***

### drawGeometry()

> `protected` **drawGeometry**(`g`, `spec`, `style?`): `void`

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:26

Trace the silhouette into `g`, then apply fill + stroke. When `style`
is supplied, it overrides the spec's fill/stroke (decoration use).

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

[`RectSpec`](../interfaces/RectSpec.md)

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

Defined in: packages/canvas/src/primitives/shapes/RectShape.ts:50

#### Parameters

##### g

[`Graphics`](../interfaces/Graphics.md)

##### spec

`Omit`\<[`RectSpec`](../interfaces/RectSpec.md), `"x"` \| `"y"`\>

##### anchor

[`Point`](../interfaces/Point.md)

##### \_angleRad

`number`

##### style?

[`ShapePaintStyle`](../interfaces/ShapePaintStyle.md)

#### Returns

`void`
