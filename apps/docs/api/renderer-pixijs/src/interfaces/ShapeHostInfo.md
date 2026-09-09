# Interface: ShapeHostInfo

## Properties

### requestRedraw

> `readonly` **requestRedraw**: () => `void`

Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
(any `image` layer) to repaint once a texture resolves.

#### Returns

`void`

***

### surface

> `readonly` **surface**: `Container`

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)
