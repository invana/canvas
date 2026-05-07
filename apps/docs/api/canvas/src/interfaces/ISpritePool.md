# Interface: ISpritePool

Defined in: [packages/canvas/src/renderers/types.ts:118](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L118)

Minimal interface for a sprite pool, used by `ShapeHostInfo` so custom
shape implementations can participate in sprite pooling without a hard
dependency on the concrete `SpritePool` class (which is internal).

## Methods

### acquire()

> **acquire**(`url`, `texture`): `Sprite`

Defined in: [packages/canvas/src/renderers/types.ts:119](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L119)

#### Parameters

##### url

`string`

##### texture

`Texture`

#### Returns

`Sprite`

***

### release()

> **release**(`url`, `sprite`): `void`

Defined in: [packages/canvas/src/renderers/types.ts:120](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L120)

#### Parameters

##### url

`string`

##### sprite

`Sprite`

#### Returns

`void`
