# Function: densityContourStrokeLayerFormToOptions()

> **densityContourStrokeLayerFormToOptions**(`f`): [`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)

Inverse of [optionsToForm](densityContourStrokeLayerOptionsToForm.md): fold the flat fields back to a serialisable
[DensityContourStrokeLayerOptions](../interfaces/DensityContourStrokeLayerOptions.md) patch. Only fields the form set are
included (no `undefined` keys), so the result is safe to spread over the
layer's current options on `setOptions`. `strokeColor` is re-fused from the
`strokePalette` toggle (`'palette'` when on, the `#rrggbb → 0xRRGGBB` colour
when off).

## Parameters

### f

[`DensityContourStrokeLayerFields`](../interfaces/DensityContourStrokeLayerFields.md)

## Returns

[`DensityContourStrokeLayerOptions`](../interfaces/DensityContourStrokeLayerOptions.md)
