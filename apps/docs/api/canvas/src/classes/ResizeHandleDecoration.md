# Class: ResizeHandleDecoration

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L74)

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

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L78)

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

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`gfx`](ShapeDecorationBase.md#gfx)

***

### host

> `protected` **host**: [`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L18)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`host`](ShapeDecorationBase.md#host)

***

### style

> `readonly` **style**: [`ResizeHandleDecorationStyle`](../interfaces/ResizeHandleDecorationStyle.md)

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L17)

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`style`](ShapeDecorationBase.md#style)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`destroy`](ShapeDecorationBase.md#destroy)

***

### getLocalHitGeometry()

> **getLocalHitGeometry**(): [`ResizeHandleHitGeometry`](../interfaces/ResizeHandleHitGeometry.md)

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L84)

See [ToggleDecoration.getLocalHitGeometry](ToggleDecoration.md#getlocalhitgeometry).

#### Returns

[`ResizeHandleHitGeometry`](../interfaces/ResizeHandleHitGeometry.md)

***

### getOuterExtent()

> **getOuterExtent**(): `number`

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L118)

#### Returns

`number`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L26)

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

Defined in: [canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/decorations/shape/ResizeHandleDecoration.ts#L88)

Render the decoration based on the current `host`.

#### Returns

`void`

#### Overrides

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`repaint`](ShapeDecorationBase.md#repaint)

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/ShapeDecorationBase.ts:33](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/base/ShapeDecorationBase.ts#L33)

#### Parameters

##### host

[`ShapeDecorationHostInfo`](../interfaces/ShapeDecorationHostInfo.md)

#### Returns

`void`

#### Inherited from

[`ShapeDecorationBase`](ShapeDecorationBase.md).[`update`](ShapeDecorationBase.md#update)
