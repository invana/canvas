# Abstract Class: ShapeDecorationBase\<TStyle\>

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:13](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L13)

Base for decorations that target shape primitives. Subclass implements
`repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
to the host's surface, set the slot z-index, cache the host, repaint).

Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
frame. The renderer registers any decoration with a `tick` method into
its animation set; a falsy return retires the decoration.

## Extends

- [`PrimitiveBase`](PrimitiveBase.md)

## Extended by

- [`GlowDecoration`](GlowDecoration.md)
- [`PulseRingDecoration`](PulseRingDecoration.md)
- [`LiquidFillDecoration`](LiquidFillDecoration.md)
- [`MarchingAntsDecoration`](MarchingAntsDecoration.md)
- [`RingDecoration`](RingDecoration.md)
- [`LabelDecoration`](LabelDecoration.md)
- [`ToggleDecoration`](ToggleDecoration.md)
- [`ResizeHandleDecoration`](ResizeHandleDecoration.md)
- [`SelectionFrameDecoration`](SelectionFrameDecoration.md)

## Type Parameters

### TStyle

`TStyle`

## Implements

- [`IShapeDecoration`](../type-aliases/IShapeDecoration.md)\<`TStyle`\>

## Constructors

### Constructor

> **new ShapeDecorationBase**\<`TStyle`\>(`style`): `ShapeDecorationBase`\<`TStyle`\>

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:20](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L20)

#### Parameters

##### style

`TStyle`

#### Returns

`ShapeDecorationBase`\<`TStyle`\>

#### Overrides

[`PrimitiveBase`](PrimitiveBase.md).[`constructor`](PrimitiveBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

***

### style

> `readonly` **style**: `TStyle`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Implementation of

`IShapeDecoration.style`

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Implementation of

`IShapeDecoration.destroy`

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IShapeDecoration.mount`

***

### repaint()

> `abstract` `protected` **repaint**(): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:39](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L39)

Render the decoration based on the current `host`.

#### Returns

`void`

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IShapeDecoration.update`
