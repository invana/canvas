# Interface: TweenOptions

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:16](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L16)

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

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:19](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L19)

***

### easing?

> `readonly` `optional` **easing?**: [`Easing`](../type-aliases/Easing.md)

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:20](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L20)

***

### from

> `readonly` **from**: `number`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:17](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L17)

***

### onComplete?

> `readonly` `optional` **onComplete?**: () => `void`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:24](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L24)

#### Returns

`void`

***

### onUpdate?

> `readonly` `optional` **onUpdate?**: (`value`) => `void`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:23](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L23)

#### Parameters

##### value

`number`

#### Returns

`void`

***

### repeat?

> `readonly` `optional` **repeat?**: `number` \| `"forever"`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:21](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L21)

***

### to

> `readonly` **to**: `number`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:18](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L18)

***

### yoyo?

> `readonly` `optional` **yoyo?**: `boolean`

Defined in: [packages/canvas/src/primitives/animation/Tween.ts:22](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/animation/Tween.ts#L22)
