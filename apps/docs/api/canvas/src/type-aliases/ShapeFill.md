# Type Alias: ShapeFill

> **ShapeFill** = `number` \| \{ `alpha?`: `number`; `color`: `number`; `kind`: `"solid"`; \} \| \{ `alpha?`: `number`; `fit?`: `"fill"` \| `"cover"` \| `"contain"` \| `"none"` \| `"tile"`; `kind`: `"image"`; `url`: `string`; \} \| \{ `alpha?`: `number`; `background?`: \{ `alpha?`: `number`; `color`: `number`; \}; `color?`: `number`; `icon`: [`IconRef`](IconRef.md); `kind`: `"icon"`; `sizeRatio?`: `number`; \}

Defined in: packages/canvas/src/primitives/types.ts:125

Fill discriminator on a shape spec. Resolved by `applyFill` at draw time.

- `number` shorthand for solid color (e.g. `0x4f9cf9`).
- `solid`  — explicit color + alpha.
- `image`  — texture lookup via `TextureRegistry`. Lazy-loaded; redraws on resolve.
- `icon`   — glyph (unicode / fontawesome) or traced SVG path (lucide / svg)
             layered as a sibling `Container` ON TOP of the silhouette,
             with an optional `background` color filling the silhouette
             underneath.

## Union Members

`number`

***

### Type Literal

\{ `alpha?`: `number`; `color`: `number`; `kind`: `"solid"`; \}

***

### Type Literal

\{ `alpha?`: `number`; `fit?`: `"fill"` \| `"cover"` \| `"contain"` \| `"none"` \| `"tile"`; `kind`: `"image"`; `url`: `string`; \}

***

### Type Literal

\{ `alpha?`: `number`; `background?`: \{ `alpha?`: `number`; `color`: `number`; \}; `color?`: `number`; `icon`: [`IconRef`](IconRef.md); `kind`: `"icon"`; `sizeRatio?`: `number`; \}

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### background?

> `readonly` `optional` **background?**: `object`

Optional plate underneath the icon (silhouette gets this fill).

##### background.alpha?

> `readonly` `optional` **alpha?**: `number`

##### background.color

> `readonly` **color**: `number`

#### color?

> `readonly` `optional` **color?**: `number`

Glyph color. Default `0xffffff`.

#### icon

> `readonly` **icon**: [`IconRef`](IconRef.md)

#### kind

> `readonly` **kind**: `"icon"`

#### sizeRatio?

> `readonly` `optional` **sizeRatio?**: `number`

Glyph size as fraction of the shape's smaller bounds dimension. Default `0.6`.
