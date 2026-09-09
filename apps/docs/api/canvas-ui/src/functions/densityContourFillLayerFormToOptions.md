# Function: densityContourFillLayerFormToOptions()

> **densityContourFillLayerFormToOptions**(`f`): [`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)

Inverse of [optionsToForm](densityContourFillLayerOptionsToForm.md): fold the flat fields back to a serialisable
[DensityContourFillLayerOptions](../interfaces/DensityContourFillLayerOptions.md) patch. Only fields the form set are
included (no `undefined` keys), so the result is safe to spread over the
layer's current options on `setOptions`.

## Parameters

### f

[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)

## Returns

[`DensityContourFillLayerOptions`](../interfaces/DensityContourFillLayerOptions.md)
