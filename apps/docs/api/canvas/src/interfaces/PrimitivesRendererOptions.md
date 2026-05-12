# Interface: PrimitivesRendererOptions

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:120](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/PrimitivesRenderer.ts#L120)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:122](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/PrimitivesRenderer.ts#L122)

***

### container

> `readonly` **container**: `Container`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:121](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/PrimitivesRenderer.ts#L121)

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:128](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/PrimitivesRenderer.ts#L128)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
