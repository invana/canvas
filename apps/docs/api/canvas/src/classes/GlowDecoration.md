# Class: GlowDecoration

Defined in: packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:23

Base for decorations that target shape primitives. Subclass implements
`repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
to the host's surface, set the slot z-index, cache the host, repaint).

Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
frame. The renderer registers any decoration with a `tick` method into
its animation set; a falsy return retires the decoration.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)\>

## Constructors

### Constructor

> **new GlowDecoration**(`style`): `GlowDecoration`

Defined in: packages/canvas/src/primitives/base/ShapeDecorationBase.ts:20

#### Parameters

##### style

[`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)

#### Returns

`GlowDecoration`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`constructor`](ShapeDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:12

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: packages/canvas/src/primitives/base/ShapeDecorationBase.ts:18

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`GlowDecorationStyle`](../interfaces/GlowDecorationStyle.md)

Defined in: packages/canvas/src/primitives/base/ShapeDecorationBase.ts:17

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:18

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeDecorationBase.ts:26

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`mount`](ShapeDecorationBase.md#mount)

***

### repaint()

> `protected` **repaint**(): `void`

Defined in: packages/canvas/src/primitives/decorations/shape/GlowDecoration.ts:26

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

Defined in: packages/canvas/src/primitives/base/ShapeDecorationBase.ts:33

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
