# Interface: IEffectBase\<THostInfo, TStyle\>

Defined in: [packages/canvas/src/primitives/types.ts:723](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L723)

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

Defined in: [packages/canvas/src/primitives/types.ts:725](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L725)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

Defined in: [packages/canvas/src/primitives/types.ts:724](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L724)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/types.ts:731](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L731)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:726](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L726)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](StyleOverride.md)

Defined in: [packages/canvas/src/primitives/types.ts:730](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L730)

#### Returns

[`StyleOverride`](StyleOverride.md)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](TransformDelta.md)

Defined in: [packages/canvas/src/primitives/types.ts:729](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L729)

#### Returns

[`TransformDelta`](TransformDelta.md)

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:728](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L728)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:727](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L727)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
