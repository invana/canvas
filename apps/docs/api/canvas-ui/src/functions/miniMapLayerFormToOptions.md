# Function: miniMapLayerFormToOptions()

> **miniMapLayerFormToOptions**(`f`): [`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)

Inverse of [optionsToForm](miniMapLayerOptionsToForm.md): fold the flat fields back to a serialisable
[MiniMapLayerOptions](../interfaces/MiniMapLayerOptions.md) patch. Only fields the form actually set are
included (no `undefined` / empty-string keys), so the result is safe to spread
over the layer's current options on `setOptions`. Colour hex strings are
converted back to the engine's `0xRRGGBB` numbers.

## Parameters

### f

[`MiniMapLayerFields`](../interfaces/MiniMapLayerFields.md)

## Returns

[`MiniMapLayerOptions`](../interfaces/MiniMapLayerOptions.md)
