# Function: connectorToSvg()

> **connectorToSvg**(`spec`, `path`, `strokeWidthScale?`, `labelStyle?`): `string`

Serialise a connector (its routed `path` + stroke + optional arrow markers)
to SVG. `strokeWidthScale` mirrors the renderer's per-instance LOD scaling.

## Parameters

### spec

[`BaseConnectorSpec`](../../../renderer-pixijs/src/interfaces/BaseConnectorSpec.md)

### path

[`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)

### strokeWidthScale?

`number`

### labelStyle?

`unknown`

## Returns

`string`
