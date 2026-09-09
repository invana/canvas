# Function: shapeSpecToSvg()

> **shapeSpecToSvg**(`spec`, `labelStyle?`): `string`

Serialise a single shape spec to an SVG element. Returns `''` for a shape
kind that has no vector representation. `labelStyle` (from an attached
`label` decoration) is rendered as `<text>` when present.

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

### labelStyle?

`unknown`

## Returns

`string`
