# Interface: PrimitivesRendererOptions

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:105](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/PrimitivesRenderer.ts#L105)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:107](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/PrimitivesRenderer.ts#L107)

***

### container

> `readonly` **container**: `Container`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:106](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/PrimitivesRenderer.ts#L106)

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:113](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/PrimitivesRenderer.ts#L113)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
