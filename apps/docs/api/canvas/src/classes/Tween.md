# Class: Tween

Defined in: packages/canvas/src/primitives/animation/Tween.ts:37

Time-based interpolation primitive. Authors call `tick(deltaMs)` once per
frame; the tween advances internal time, applies easing, fires `onUpdate`,
and returns `false` when finished so the caller can retire it.

The tween itself does no scheduling — it's a pure state machine. Effects
and decorations hold a `Tween` and drive it from their own `tick(dt)`.

Reusable: call `reset()` to play again from `from`.

## Constructors

### Constructor

> **new Tween**(`opts`): `Tween`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:46

#### Parameters

##### opts

[`TweenOptions`](../interfaces/TweenOptions.md)

#### Returns

`Tween`

## Accessors

### done

#### Get Signature

> **get** **done**(): `boolean`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:60

##### Returns

`boolean`

***

### value

#### Get Signature

> **get** **value**(): `number`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:56

##### Returns

`number`

## Methods

### reset()

> **reset**(): `void`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:102

Restart from `from`. Clears `done`.

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `boolean`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:70

Advance by `dt` milliseconds. Returns `false` when the tween has finished
its final cycle; callers should remove finished tweens from their tick
set. Returns `true` while still running (including indefinitely for
`repeat: 'forever'`).

#### Parameters

##### dt

`number`

#### Returns

`boolean`
