# Interface: StaticDecorationKind\<TOpts\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:185](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L185)

Static decoration descriptor.

`draw` emits decoration geometry into the supplied Graphics given host
bounds + style options. `hostKind` is supplied so a decoration can vary
its outline by host shape (circle hosts get a circular halo, rect hosts
get a rounded-rect halo).

`setup` (optional) is called once when the decoration is first installed
on its host's slot Container, before any `draw`. Used for one-time
Container-level setup that can't be expressed as Graphics calls — e.g.
applying a `BlurFilter` for glow. Decorations that don't need it omit
the hook.

## Type Parameters

### TOpts

`TOpts`

## Methods

### draw()

> **draw**(`g`, `bounds`, `opts`, `hostKind?`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:187](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L187)

#### Parameters

##### g

[`Graphics`](../../../interfaces/Graphics.md)

##### bounds

[`Rect`](Rect.md)

##### opts

`TOpts`

##### hostKind?

`string`

#### Returns

`void`

***

### setup()?

> `optional` **setup**(`slot`, `opts`): `void`

Defined in: [packages/canvas/src/renderers/draw/types.ts:186](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L186)

#### Parameters

##### slot

`Container`

##### opts

`TOpts`

#### Returns

`void`
