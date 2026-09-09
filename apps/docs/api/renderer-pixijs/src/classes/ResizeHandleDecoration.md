# Class: ResizeHandleDecoration

Small square handle drawn at a configurable anchor on the host shape's
AABB. Pure visual; emits no events. `GroupResizeBehaviour` (in
`@invana/graph`) reads `getLocalHitGeometry()` and resolves drags itself.

Multiple handles per host are expected — register one decoration per
corner / side with distinct slot ids (`'resize-tl'`, `'resize-br'`, …)
and the renderer will mount each into its own slot.

## Extends

- [`ShapeDecorationBase`](ShapeDecorationBase.md)\<[`ResizeHandleDecorationStyle`](../interfaces/ResizeHandleDecorationStyle.md)\>

## Constructors

### Constructor

> **new ResizeHandleDecoration**(`style`): `ResizeHandleDecoration`

#### Parameters

##### style

[`ResizeHandleDecorationStyle`](../interfaces/ResizeHandleDecorationStyle.md)

#### Returns

`ResizeHandleDecoration`

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

> `readonly` **style**: [`ResizeHandleDecorationStyle`](../interfaces/ResizeHandleDecorationStyle.md)

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

### getLocalHitGeometry()

> **getLocalHitGeometry**(): [`ResizeHandleHitGeometry`](../interfaces/ResizeHandleHitGeometry.md)

See [ToggleDecoration.getLocalHitGeometry](ToggleDecoration.md#getlocalhitgeometry).

#### Returns

[`ResizeHandleHitGeometry`](../interfaces/ResizeHandleHitGeometry.md)

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
