# Class: BreathingEffect

Defined in: [canvas/src/primitives/effects/shape/BreathingEffect.ts:27](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/shape/BreathingEffect.ts#L27)

Sinusoidal scale modulation around 1.0. Cycles forever — never retires on
its own; remove explicitly via `setEffect(id, slot, null)`. Uses a raw
sine accumulator rather than `Tween` because the motion is naturally
cyclical (no start / end / easing curve to compose).

## Extends

- [`EffectBase`](EffectBase.md)\<[`BreathingEffectStyle`](../interfaces/BreathingEffectStyle.md)\>

## Constructors

### Constructor

> **new BreathingEffect**(`style`): `BreathingEffect`

Defined in: [canvas/src/primitives/effects/shape/BreathingEffect.ts:37](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/shape/BreathingEffect.ts#L37)

#### Parameters

##### style

[`BreathingEffectStyle`](../interfaces/BreathingEffectStyle.md)

#### Returns

`BreathingEffect`

#### Overrides

[`EffectBase`](EffectBase.md).[`constructor`](EffectBase.md#constructor)

## Properties

### host

> `protected` **host**: [`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md) = `null`

Defined in: [canvas/src/primitives/base/EffectBase.ts:32](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L32)

#### Inherited from

[`EffectBase`](EffectBase.md).[`host`](EffectBase.md#host)

***

### style

> `readonly` **style**: [`BreathingEffectStyle`](../interfaces/BreathingEffectStyle.md)

Defined in: [canvas/src/primitives/base/EffectBase.ts:31](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L31)

#### Inherited from

[`EffectBase`](EffectBase.md).[`style`](EffectBase.md#style)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md) = `'transform'`

Defined in: [canvas/src/primitives/effects/shape/BreathingEffect.ts:28](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/shape/BreathingEffect.ts#L28)

#### Overrides

[`EffectBase`](EffectBase.md).[`target`](EffectBase.md#target)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/base/EffectBase.ts:46](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L46)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`destroy`](EffectBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/base/EffectBase.ts:38](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L38)

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

Defined in: [canvas/src/primitives/base/EffectBase.ts:66](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L66)

Required by style-effects; the renderer ignores it for transform-effects.
Subclasses with `target='style'` must override.

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Inherited from

[`EffectBase`](EffectBase.md).[`readStyle`](EffectBase.md#readstyle)

***

### readTransform()

> **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Defined in: [canvas/src/primitives/effects/shape/BreathingEffect.ts:54](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/shape/BreathingEffect.ts#L54)

Required by transform-effects; the renderer ignores it for style-effects.
Subclasses with `target='transform'` must override.

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Overrides

[`EffectBase`](EffectBase.md).[`readTransform`](EffectBase.md#readtransform)

***

### tick()

> **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/effects/shape/BreathingEffect.ts:45](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/effects/shape/BreathingEffect.ts#L45)

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

Defined in: [canvas/src/primitives/base/EffectBase.ts:42](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/base/EffectBase.ts#L42)

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`update`](EffectBase.md#update)
