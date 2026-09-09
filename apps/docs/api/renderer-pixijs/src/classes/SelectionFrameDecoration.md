# Class: SelectionFrameDecoration

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

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`SelectionFrameDecorationStyle`](../interfaces/SelectionFrameDecorationStyle.md)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getLocalHandleHits()

> **getLocalHandleHits**(): readonly [`SelectionFrameHandleHit`](../interfaces/SelectionFrameHandleHit.md)[]

Most-recently-computed per-handle hit geometry, in shape-local
coordinates. Behaviours iterate this array on pointerdown and test
each disk against the world-space click.

#### Returns

readonly [`SelectionFrameHandleHit`](../interfaces/SelectionFrameHandleHit.md)[]

***

### getOuterExtent()

> **getOuterExtent**(): `number`

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

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

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
