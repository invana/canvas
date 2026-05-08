# Interface: PrimitivesRendererOptions

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:79

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:81

***

### container

> `readonly` **container**: `Container`

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:80

***

### iconRegistry?

> `readonly` `optional` **iconRegistry?**: [`IIconRegistry`](IIconRegistry.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:93

Optional shared icon registry. When omitted, the renderer creates a
default registry pre-populated with starter sets for Lucide and
FontAwesome 6.

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: packages/canvas/src/primitives/PrimitivesRenderer.ts:87

Optional shared texture registry. When omitted, the renderer creates an
internal one — image fills still work (lazy-loaded), but textures are
not shared across renderer instances.
