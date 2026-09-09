# Function: connectorToSvg()

> **connectorToSvg**(`spec`, `path`, `strokeWidthScale?`, `labelStyle?`): `string`

Serialise a connector (its routed `path` + stroke + optional arrow markers)
to SVG. `strokeWidthScale` mirrors the renderer's per-instance LOD scaling.

## Parameters

### spec

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

### path

[`Path`](../type-aliases/Path.md)

### strokeWidthScale?

`number` = `1`

### labelStyle?

`unknown`

## Returns

`string`
