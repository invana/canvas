# Interface: ShapeHostInfo

Defined in: [canvas/src/primitives/types.ts:546](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L546)

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface to attach to plus the registries that fill resolution
needs (`textureRegistry` for image fills).

## Properties

### requestRedraw

> `readonly` **requestRedraw**: () => `void`

Defined in: [canvas/src/primitives/types.ts:553](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L553)

Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
(image silhouette, image-inset) to repaint once a texture resolves.

#### Returns

`void`

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:547](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L547)

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [canvas/src/primitives/types.ts:548](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L548)
