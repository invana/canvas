# Class: Tween

Time-based interpolation primitive. Authors call `tick(deltaMs)` once per
frame; the tween advances internal time, applies easing, fires `onUpdate`,
and returns `false` when finished so the caller can retire it.

The tween itself does no scheduling — it's a pure state machine. Effects
and decorations hold a `Tween` and drive it from their own `tick(dt)`.

Reusable: call `reset()` to play again from `from`.

## Constructors

### Constructor

> **new Tween**(`opts`): `Tween`

#### Parameters

##### opts

[`TweenOptions`](../interfaces/TweenOptions.md)

#### Returns

`Tween`

## Accessors

### done

#### Get Signature

> **get** **done**(): `boolean`

##### Returns

`boolean`

***

### value

#### Get Signature

> **get** **value**(): `number`

##### Returns

`number`

## Methods

### reset()

> **reset**(): `void`

Restart from `from`. Clears `done`.

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `boolean`

Advance by `dt` milliseconds. Returns `false` when the tween has finished
its final cycle; callers should remove finished tweens from their tick
set. Returns `true` while still running (including indefinitely for
`repeat: 'forever'`).

#### Parameters

##### dt

`number`

#### Returns

`boolean`
