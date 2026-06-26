# Interface: IEffectBase\<THostInfo, TStyle\>

Defined in: [canvas/src/primitives/types.ts:921](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L921)

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

Defined in: [canvas/src/primitives/types.ts:923](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L923)

***

### target

> `readonly` **target**: [`EffectTarget`](../type-aliases/EffectTarget.md)

Defined in: [canvas/src/primitives/types.ts:922](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L922)

## Methods

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [canvas/src/primitives/types.ts:929](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L929)

#### Returns

`void`

***

### mount()

> **mount**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:924](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L924)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`

***

### readStyle()?

> `optional` **readStyle**(): [`StyleOverride`](StyleOverride.md)

Defined in: [canvas/src/primitives/types.ts:928](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L928)

#### Returns

[`StyleOverride`](StyleOverride.md)

***

### readTransform()?

> `optional` **readTransform**(): [`TransformDelta`](TransformDelta.md)

Defined in: [canvas/src/primitives/types.ts:927](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L927)

#### Returns

[`TransformDelta`](TransformDelta.md)

***

### tick()?

> `optional` **tick**(`deltaMs`): `boolean`

Defined in: [canvas/src/primitives/types.ts:926](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L926)

#### Parameters

##### deltaMs

`number`

#### Returns

`boolean`

***

### update()?

> `optional` **update**(`host`): `void`

Defined in: [canvas/src/primitives/types.ts:925](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L925)

#### Parameters

##### host

`THostInfo`

#### Returns

`void`
