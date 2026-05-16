# Class: ShakeEffect

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:34](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L34)

Per-frame random jitter applied to the host's position. Pure transform
modulation — the host's spec is untouched; removing the effect (or letting
`decayMs` retire it) reverts the host to its baseline position on the next
frame.

Uses `Tween` for the optional decay envelope so easing stays consistent
with other animated primitives.

## Extends

- [`EffectBase`](EffectBase.md)\<[`ShakeEffectStyle`](../interfaces/ShakeEffectStyle.md)\>

## Constructors

### Constructor

> **new ShakeEffect**(`style`): `ShakeEffect`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:44](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L44)

#### Parameters

##### style

[`ShakeEffectStyle`](../interfaces/ShakeEffectStyle.md)

#### Returns

`ShakeEffect`

#### Overrides

[`EffectBase`](EffectBase.md).[`constructor`](EffectBase.md#constructor)

## Properties

### host

> `protected` **host**: [`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/EffectBase.ts:32](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L32)

#### Inherited from

[`EffectBase`](EffectBase.md).[`host`](EffectBase.md#host)

***

### style

> `readonly` **style**: [`ShakeEffectStyle`](../interfaces/ShakeEffectStyle.md)

Defined in: [canvas/src/primitives/base/EffectBase.ts:31](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L31)

#### Inherited from

[`EffectBase`](EffectBase.md).[`style`](EffectBase.md#style)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md) = `'transform'`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:35](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L35)

#### Overrides

[`EffectBase`](EffectBase.md).[`target`](EffectBase.md#target)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/EffectBase.ts:46](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L46)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`destroy`](EffectBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/EffectBase.ts:38](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L38)

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`mount`](EffectBase.md#mount)

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](../interfaces/StyleOverride.md)

Defined in: [canvas/src/primitives/base/EffectBase.ts:66](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L66)

Required by style-effects; the renderer ignores it for transform-effects.
Subclasses with `target='style'` must override.

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Inherited from

[`EffectBase`](EffectBase.md).[`readStyle`](EffectBase.md#readstyle)

***

### readTransform()

> **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:75](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L75)

Required by transform-effects; the renderer ignores it for style-effects.
Subclasses with `target='transform'` must override.

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Overrides

[`EffectBase`](EffectBase.md).[`readTransform`](EffectBase.md#readtransform)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/effects/shape/ShakeEffect.ts:54](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/effects/shape/ShakeEffect.ts#L54)

Optional per-frame advance. Subclasses override; the base no-ops. Return
`false` to retire the effect from the renderer's animation set.

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

#### Overrides

[`EffectBase`](EffectBase.md).[`tick`](EffectBase.md#tick)

***

### update()

> **update**(`host`): `void`

Defined in: [canvas/src/primitives/base/EffectBase.ts:42](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/base/EffectBase.ts#L42)

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`update`](EffectBase.md#update)
