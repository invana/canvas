# Function: fillPaint()

> **fillPaint**(`fill`): `Record`\<`string`, `string` \| `number` \| `undefined`\>

Resolve a [ShapeFill](../type-aliases/ShapeFill.md) to SVG `fill` / `fill-opacity`. Only the first
`solid` layer is representable in flat SVG; `image` / `glyph` / `svg` fills
are skipped (→ `fill: none`), documented as a raster-only feature.

## Parameters

### fill

[`ShapeFill`](../type-aliases/ShapeFill.md)

## Returns

`Record`\<`string`, `string` \| `number` \| `undefined`\>
