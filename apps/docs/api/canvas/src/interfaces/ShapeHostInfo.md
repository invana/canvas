# Interface: ShapeHostInfo

Defined in: [canvas/src/primitives/types.ts:611](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L611)

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface to attach to plus the registries that fill resolution
needs (`textureRegistry` for image fills).

## Properties

### requestRedraw

> `readonly` **requestRedraw**: () => `void`

Defined in: [canvas/src/primitives/types.ts:618](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L618)

Re-invoke the shape's `draw(currentSpec)`. Used by async fill loaders
(any `image` layer) to repaint once a texture resolves.

#### Returns

`void`

***

### surface

> `readonly` **surface**: `Container`

Defined in: [canvas/src/primitives/types.ts:612](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L612)

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [canvas/src/primitives/types.ts:613](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L613)
