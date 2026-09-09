# Function: graphLegendLayerFormToOptions()

> **graphLegendLayerFormToOptions**(`f`): [`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md)

Inverse of [optionsToForm](graphLegendLayerOptionsToForm.md): fold the flat fields back to a serialisable
[GraphLegendLayerOptions](../interfaces/GraphLegendLayerOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
layer's current options on `setOptions`. `margin` is re-fused from `marginX` /
`marginY` — a plain number when both agree, otherwise a `{ x, y }` object.

The three title fields are the one place an **empty string is meaningful**
(it's how the form says "no heading", which the engine reads as falsy), so
they are emitted even when blank.

## Parameters

### f

[`GraphLegendLayerFields`](../interfaces/GraphLegendLayerFields.md)

## Returns

[`GraphLegendLayerOptions`](../interfaces/GraphLegendLayerOptions.md)
