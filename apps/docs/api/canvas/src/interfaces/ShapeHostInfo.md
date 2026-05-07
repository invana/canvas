# Interface: ShapeHostInfo

Defined in: [packages/canvas/src/renderers/types.ts:135](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L135)

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface they should attach to plus camera access for any
resolution-aware drawing (e.g. text rasterisation).

`textureRegistry` and `spritePool` are optional engine internals. Shapes
that accept a `url` field in their spec use the registry for texture
resolution; shapes that create `Sprite` instances use the pool to avoid
GC churn at 500k+ scale. Shapes that don't need either can ignore them.

## Properties

### spritePool?

> `readonly` `optional` **spritePool?**: [`ISpritePool`](ISpritePool.md)

Defined in: [packages/canvas/src/renderers/types.ts:141](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L141)

Object pool for `Sprite` reuse — reduces GC pressure at scale.

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:137](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L137)

Surface to attach the shape's root `Container` to.

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/renderers/types.ts:139](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L139)

Registry for URL-based texture lookup and lazy loading.
