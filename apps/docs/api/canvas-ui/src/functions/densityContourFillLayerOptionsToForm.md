# Function: densityContourFillLayerOptionsToForm()

> **densityContourFillLayerOptionsToForm**(`o?`): [`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)

Map a `DensityContourFillLayerOptions`-shaped patch to the flat
[DensityContourFillLayerFields](../type-aliases/DensityContourFillLayerFields.md). All fields are scalars (no colour
numbers, no nested groups), so this is a direct pass-through — `thresholds`
keeps only its scalar band-count form (an explicit iso-value array is out of
scope and round-trips as `undefined`).

## Parameters

### o?

[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md) = `{}`

## Returns

[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)
