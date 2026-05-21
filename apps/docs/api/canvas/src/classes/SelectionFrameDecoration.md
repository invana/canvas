# Class: SelectionFrameDecoration

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:153](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L153)

Selection / transform frame — dashed AABB outline plus round drag
handles at the four corners and four edge midpoints. Pure visual; the
resize behaviour reads `getLocalHandleHits()` and runs its own
pointer hit math against the returned per-handle disks.

Repaints in place on style change so a behaviour can flip the
`visible` field, change the dash colour, or hide / show specific
handles via `handles` without remounting.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`SelectionFrameDecorationStyle`](../interfaces/SelectionFrameDecorationStyle.md)\>

## Constructors

### Constructor

> **new SelectionFrameDecoration**(`style`): `SelectionFrameDecoration`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:158](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L158)

#### Parameters

##### style

[`SelectionFrameDecorationStyle`](../interfaces/SelectionFrameDecorationStyle.md)

#### Returns

`SelectionFrameDecoration`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`constructor`](ShapeDecorationBase.md#constructor)

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`SelectionFrameDecorationStyle`](../interfaces/SelectionFrameDecorationStyle.md)

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getLocalHandleHits()

> **getLocalHandleHits**(): readonly [`SelectionFrameHandleHit`](../interfaces/SelectionFrameHandleHit.md)[]

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:169](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L169)

Most-recently-computed per-handle hit geometry, in shape-local
coordinates. Behaviours iterate this array on pointerdown and test
each disk against the world-space click.

#### Returns

readonly [`SelectionFrameHandleHit`](../interfaces/SelectionFrameHandleHit.md)[]

***

### getOuterExtent()

> **getOuterExtent**(): `number`

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:274](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L274)

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

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

Defined in: [canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts:173](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/shape/SelectionFrameDecoration.ts#L173)

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
