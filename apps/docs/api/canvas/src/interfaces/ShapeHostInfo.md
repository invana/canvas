# Interface: ShapeHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:495](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L495)

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface to attach to plus the registries that fill resolution
needs (`textureRegistry` for image fills).

## Properties

### requestRedraw

> `readonly` **requestRedraw**: () => `void`

Defined in: [packages/canvas/src/primitives/types.ts:502](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L502)

Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
(image silhouette, image-inset) to repaint once a texture resolves.

#### Returns

`void`

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:496](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L496)

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/primitives/types.ts:497](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L497)
