# Class: MarchingAntsDecoration

Defined in: [canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:37](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L37)

Base for decorations that target shape primitives. Subclass implements
`repaint`; this base handles the `mount` / `update` lifecycle (attach gfx
to the host's surface, set the slot z-index, cache the host, repaint).

Animation: subclass adds `tick(deltaMs)` if it wants to be advanced per
frame. The renderer registers any decoration with a `tick` method into
its animation set; a falsy return retires the decoration.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`MarchingAntsDecorationStyle`](../interfaces/MarchingAntsDecorationStyle.md)\>

## Constructors

### Constructor

> **new MarchingAntsDecoration**(`style`): `MarchingAntsDecoration`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:20](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L20)

#### Parameters

##### style

[`MarchingAntsDecorationStyle`](../interfaces/MarchingAntsDecorationStyle.md)

#### Returns

`MarchingAntsDecoration`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`constructor`](ShapeDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`MarchingAntsDecorationStyle`](../interfaces/MarchingAntsDecorationStyle.md)

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

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

Defined in: [canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:41](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L41)

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts:49](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/shape/MarchingAntsDecoration.ts#L49)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
