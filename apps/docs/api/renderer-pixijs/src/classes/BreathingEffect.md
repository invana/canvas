# Class: BreathingEffect

Sinusoidal scale modulation around 1.0. Cycles forever — never retires on
its own; remove explicitly via `setEffect(id, slot, null)`. Uses a raw
sine accumulator rather than `Tween` because the motion is naturally
cyclical (no start / end / easing curve to compose).

## Extends

- [`EffectBase`](EffectBase.md)\<[`BreathingEffectStyle`](../interfaces/BreathingEffectStyle.md)\>

## Constructors

### Constructor

> **new BreathingEffect**(`style`): `BreathingEffect`

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

#### Inherited from

[`EffectBase`](EffectBase.md).[`host`](EffectBase.md#host)

***

### style

> `readonly` **style**: [`BreathingEffectStyle`](../interfaces/BreathingEffectStyle.md)

#### Inherited from

[`EffectBase`](EffectBase.md).[`style`](EffectBase.md#style)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md) = `'transform'`

#### Overrides

[`EffectBase`](EffectBase.md).[`target`](EffectBase.md#target)

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`destroy`](EffectBase.md#destroy)

***

### mount()

> **mount**(`host`): `void`

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

Required by style-effects; the renderer ignores it for transform-effects.
Subclasses with `target='style'` must override.

#### Returns

[`StyleOverride`](../interfaces/StyleOverride.md)

#### Inherited from

[`EffectBase`](EffectBase.md).[`readStyle`](EffectBase.md#readstyle)

***

### readTransform()

> **readTransform**(): [`TransformDelta`](../interfaces/TransformDelta.md)

Required by transform-effects; the renderer ignores it for style-effects.
Subclasses with `target='transform'` must override.

#### Returns

[`TransformDelta`](../interfaces/TransformDelta.md)

#### Overrides

[`EffectBase`](EffectBase.md).[`readTransform`](EffectBase.md#readtransform)

***

### tick()

> **tick**(`deltaMs`): `boolean`

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

#### Parameters

##### host

[`ShapeEffectHostInfo`](../interfaces/ShapeEffectHostInfo.md)

#### Returns

`void`

#### Inherited from

[`EffectBase`](EffectBase.md).[`update`](EffectBase.md#update)
