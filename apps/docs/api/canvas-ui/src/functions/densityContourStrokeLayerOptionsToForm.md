# Function: densityContourStrokeLayerOptionsToForm()

> **densityContourStrokeLayerOptionsToForm**(`o?`): [`DensityContourStrokeLayerFields`](../interfaces/DensityContourStrokeLayerFields.md)

Map a `DensityContourStrokeLayerOptions`-shaped patch to the flat
[DensityContourStrokeLayerFields](../interfaces/DensityContourStrokeLayerFields.md). The engine's `strokeColor: number |
'palette'` is split: `strokePalette` becomes a boolean toggle and the
constant colour (when present) is normalised from `0xRRGGBB` to `#rrggbb`.
`thresholds` / `strokeWidth` keep only their scalar forms.

## Parameters

### o?

[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md) = `{}`

## Returns

[`DensityContourStrokeLayerFields`](../interfaces/DensityContourStrokeLayerFields.md)
