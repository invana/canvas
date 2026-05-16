# Interface: PrimitivesRendererOptions

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:144](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/PrimitivesRenderer.ts#L144)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:146](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/PrimitivesRenderer.ts#L146)

***

### container

> `readonly` **container**: `Container`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:145](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/PrimitivesRenderer.ts#L145)

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:152](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/PrimitivesRenderer.ts#L152)

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
