# Function: exportSVG()

> **exportSVG**(`canvas`, `opts?`): `string`

Build the full SVG document for a canvas. Walks visible layers in z-order,
collects each [SvgExportableLayer.toSVG](../interfaces/SvgExportableLayer.md#tosvg) fragment, and wraps them in an
`<svg>` sized to the capture region with an optional background rect.

Throws when the capture region is empty (nothing to export).

## Parameters

### canvas

[`Canvas`](../classes/Canvas.md)

### opts?

[`ExportSvgOptions`](../interfaces/ExportSvgOptions.md) = `{}`

## Returns

`string`
