# Function: mapLayerFormToOptions()

> **mapLayerFormToOptions**(`f`): [`MapLayerOptions`](../interfaces/MapLayerOptions.md)

Inverse of [optionsToForm](mapLayerOptionsToForm.md): fold the flat fields back to a serialisable
[MapLayerOptions](../interfaces/MapLayerOptions.md) patch. Only fields the form set are included (no
`undefined` keys), so the result is safe to spread over the layer's current
options on `setOptions`. `center` is reassembled into a `[lng, lat]` tuple
only when both `centerLng` and `centerLat` are set.

## Parameters

### f

[`MapLayerFields`](../interfaces/MapLayerFields.md)

## Returns

[`MapLayerOptions`](../interfaces/MapLayerOptions.md)
