# Function: wheelZoomFormToOptions()

> **wheelZoomFormToOptions**(`f`): [`WheelZoomOptions`](../interfaces/WheelZoomOptions.md)

Inverse of [optionsToForm](wheelZoomOptionsToForm.md): fold the flat fields back to a serialisable
[WheelZoomOptions](../interfaces/WheelZoomOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`. `smooth` is re-fused from the
toggle + frame count (`false` when off, the frame count — default 8 — when on).

## Parameters

### f

[`WheelZoomFields`](../interfaces/WheelZoomFields.md)

## Returns

[`WheelZoomOptions`](../interfaces/WheelZoomOptions.md)
