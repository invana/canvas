# Interface: ShapeHostInfo

Defined in: [packages/canvas/src/primitives/types.ts:495](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L495)

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface to attach to plus the registries that fill resolution
needs (`textureRegistry` for image fills).

## Properties

### requestRedraw

> `readonly` **requestRedraw**: () => `void`

Defined in: [packages/canvas/src/primitives/types.ts:502](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L502)

Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
(image silhouette, image-inset) to repaint once a texture resolves.

#### Returns

`void`

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/primitives/types.ts:496](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L496)

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/primitives/types.ts:497](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L497)
