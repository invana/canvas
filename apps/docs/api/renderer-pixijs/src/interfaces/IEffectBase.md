# Interface: IEffectBase\<THostInfo, TStyle\>

Common interface for shape and connector effects. Mirrors `IDecorationBase`
but reads modulations instead of drawing geometry. Animated effects expose
`tick(deltaMs)` (renderer advances them each frame); static effects omit it
and only contribute via `readTransform` / `readStyle`.

An effect declares exactly one of:
 - `readTransform()` when `target === 'transform'`.
 - `readStyle()` when `target === 'style'`.
The renderer ignores whichever isn't relevant for the declared target.

## Type Parameters

### THostInfo

`THostInfo`

### TStyle

`TStyle` = `unknown`

## Properties

### style

> `readonly` **style**: `TStyle`

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](StyleOverride.md)

#### Returns

[`StyleOverride`](StyleOverride.md)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](TransformDelta.md)

#### Returns

[`TransformDelta`](TransformDelta.md)

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
