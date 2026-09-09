# Abstract Class: ShapeDecorationBase\<TStyle\>

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

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`gfx`](PrimitiveBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

***

### style

> `readonly` **style**: `TStyle`

#### Implementation of

`IShapeDecoration.style`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

`IShapeDecoration.destroy`

#### Inherited from

[`PrimitiveBase`](PrimitiveBase.md).[`destroy`](PrimitiveBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

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

Render the decoration based on the current `host`.

#### Returns

`void`

***

### update()

> **update**(`host`): `void`

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Implementation of

`IShapeDecoration.update`
