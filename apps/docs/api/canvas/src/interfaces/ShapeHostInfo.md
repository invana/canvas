# Interface: ShapeHostInfo

Defined in: packages/canvas/src/primitives/types.ts:264

Information a `Shape` instance receives at construction. The renderer hands
shapes the surface to attach to plus the registries that fill resolution
needs (`textureRegistry` for image fills, `iconRegistry` for icon fills).

## Properties

### iconRegistry

> `readonly` **iconRegistry**: [`IIconRegistry`](IIconRegistry.md)

Defined in: packages/canvas/src/primitives/types.ts:267

***

### surface

> `readonly` **surface**: `Container`

Defined in: packages/canvas/src/primitives/types.ts:265

***

### textureRegistry

> `readonly` **textureRegistry**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: packages/canvas/src/primitives/types.ts:266
