# Type Alias: FillInput

> **FillInput** = `number` \| `Texture`

Defined in: [packages/canvas/src/renderers/draw/types.ts:28](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L28)

Accepted value for `fill` in shape specs.

- `number` — solid color (e.g. `0x4f9cf9`). `fillAlpha` controls opacity.
- `Texture` — image projected onto the shape geometry. The shape boundary
  acts as the clip mask; sizing is controlled by `fillFit`.
  Use `TextureRegistry` to load and share textures by URL.
