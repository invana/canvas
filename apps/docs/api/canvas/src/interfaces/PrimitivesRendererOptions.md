# Interface: PrimitivesRendererOptions

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:136](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L136)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:138](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L138)

***

### container

> `readonly` **container**: `Container`

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:137](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L137)

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/primitives/PrimitivesRenderer.ts:144](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/PrimitivesRenderer.ts#L144)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
