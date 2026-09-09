# Function: devInfoLayerFormToOptions()

> **devInfoLayerFormToOptions**(`f`): [`DevInfoLayerOptions`](../interfaces/DevInfoLayerOptions.md)

Inverse of [optionsToForm](devInfoLayerOptionsToForm.md): fold the flat fields back to a serialisable
[DevInfoLayerOptions](../interfaces/DevInfoLayerOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys). `margin` is re-fused from `marginX` / `marginY`
— a plain number when both are equal, otherwise a `{ x, y }` object; omitted
entirely when neither is set.

## Parameters

### f

[`DevInfoLayerFields`](../interfaces/DevInfoLayerFields.md)

## Returns

[`DevInfoLayerOptions`](../interfaces/DevInfoLayerOptions.md)
