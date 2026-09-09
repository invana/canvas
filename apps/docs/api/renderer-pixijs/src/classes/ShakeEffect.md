# Class: ShakeEffect

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

#### Inherited from

[`EffectBase`](EffectBase.md).[`host`](EffectBase.md#host)

***

### style

> `readonly` **style**: [`ShakeEffectStyle`](../interfaces/ShakeEffectStyle.md)

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
