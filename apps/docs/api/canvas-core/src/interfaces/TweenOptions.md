# Interface: TweenOptions

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

***

### easing?

> `readonly` `optional` **easing?**: [`Easing`](../type-aliases/Easing.md)

***

### from

> `readonly` **from**: `number`

***

### onComplete?

> `readonly` `optional` **onComplete?**: () => `void`

#### Returns

`void`

***

### onUpdate?

> `readonly` `optional` **onUpdate?**: (`value`) => `void`

#### Parameters

##### value

`number`

#### Returns

`void`

***

### repeat?

> `readonly` `optional` **repeat?**: `number` \| `"forever"`

***

### to

> `readonly` **to**: `number`

***

### yoyo?

> `readonly` `optional` **yoyo?**: `boolean`
