# Interface: TweenOptions

Defined in: packages/canvas/src/primitives/animation/Tween.ts:16

Options for constructing a `Tween`. `from` / `to` / `duration` are required;
everything else is optional and falls back to a sensible default.

- `easing` defaults to `linear`.
- `repeat` is either an integer count (number of additional cycles after the
  first) or `'forever'`. Defaults to `0` (play once).
- `yoyo` reverses direction on each repeat. Only meaningful when `repeat`
  is non-zero. Defaults to `false`.
- `onUpdate(value)` fires every `tick` with the current eased value.
- `onComplete()` fires once when the tween retires (final cycle ends).
  Never fires for `repeat: 'forever'`.

## Properties

### duration

> `readonly` **duration**: `number`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:19

***

### easing?

> `readonly` `optional` **easing?**: [`Easing`](../type-aliases/Easing.md)

Defined in: packages/canvas/src/primitives/animation/Tween.ts:20

***

### from

> `readonly` **from**: `number`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:17

***

### onComplete?

> `readonly` `optional` **onComplete?**: () => `void`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:24

#### Returns

`void`

***

### onUpdate?

> `readonly` `optional` **onUpdate?**: (`value`) => `void`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:23

#### Parameters

##### value

`number`

#### Returns

`void`

***

### repeat?

> `readonly` `optional` **repeat?**: `number` \| `"forever"`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:21

***

### to

> `readonly` **to**: `number`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:18

***

### yoyo?

> `readonly` `optional` **yoyo?**: `boolean`

Defined in: packages/canvas/src/primitives/animation/Tween.ts:22
