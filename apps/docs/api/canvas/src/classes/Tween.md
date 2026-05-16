# Class: Tween

Defined in: [canvas/src/primitives/animation/Tween.ts:37](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L37)

Time-based interpolation primitive. Authors call `tick(deltaMs)` once per
frame; the tween advances internal time, applies easing, fires `onUpdate`,
and returns `false` when finished so the caller can retire it.

The tween itself does no scheduling — it's a pure state machine. Effects
and decorations hold a `Tween` and drive it from their own `tick(dt)`.

Reusable: call `reset()` to play again from `from`.

## Constructors

### Constructor

> **new Tween**(`opts`): `Tween`

Defined in: [canvas/src/primitives/animation/Tween.ts:46](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L46)

#### Parameters

##### opts

[`TweenOptions`](../interfaces/TweenOptions.md)

#### Returns

`Tween`

## Accessors

### done

#### Get Signature

> **get** **done**(): `boolean`

Defined in: [canvas/src/primitives/animation/Tween.ts:60](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L60)

##### Returns

`boolean`

***

### value

#### Get Signature

> **get** **value**(): `number`

Defined in: [canvas/src/primitives/animation/Tween.ts:56](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L56)

##### Returns

`number`

## Methods

### reset()

> **reset**(): `void`

Defined in: [canvas/src/primitives/animation/Tween.ts:102](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L102)

Restart from `from`. Clears `done`.

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `boolean`

Defined in: [canvas/src/primitives/animation/Tween.ts:70](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/animation/Tween.ts#L70)

Advance by `dt` milliseconds. Returns `false` when the tween has finished
its final cycle; callers should remove finished tweens from their tick
set. Returns `true` while still running (including indefinitely for
`repeat: 'forever'`).

#### Parameters

##### dt

`number`

#### Returns

`boolean`
