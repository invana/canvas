# Interface: IEffectBase\<THostInfo, TStyle\>

Defined in: [packages/canvas/src/primitives/types.ts:824](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L824)

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

Defined in: [packages/canvas/src/primitives/types.ts:826](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L826)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

Defined in: [packages/canvas/src/primitives/types.ts:825](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L825)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/types.ts:832](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L832)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:827](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L827)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](StyleOverride.md)

Defined in: [packages/canvas/src/primitives/types.ts:831](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L831)

#### Returns

[`StyleOverride`](StyleOverride.md)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](TransformDelta.md)

Defined in: [packages/canvas/src/primitives/types.ts:830](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L830)

#### Returns

[`TransformDelta`](TransformDelta.md)

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [packages/canvas/src/primitives/types.ts:829](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L829)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [packages/canvas/src/primitives/types.ts:828](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L828)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
