# Interface: IEffectBase\<THostInfo, TStyle\>

Defined in: [canvas/src/primitives/types.ts:829](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L829)

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

Defined in: [canvas/src/primitives/types.ts:831](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L831)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

Defined in: [canvas/src/primitives/types.ts:830](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L830)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:837](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L837)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:832](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L832)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](StyleOverride.md)

Defined in: [canvas/src/primitives/types.ts:836](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L836)

#### Returns

[`StyleOverride`](StyleOverride.md)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](TransformDelta.md)

Defined in: [canvas/src/primitives/types.ts:835](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L835)

#### Returns

[`TransformDelta`](TransformDelta.md)

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/types.ts:834](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L834)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:833](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L833)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
