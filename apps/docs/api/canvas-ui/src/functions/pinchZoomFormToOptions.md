# Function: pinchZoomFormToOptions()

> **pinchZoomFormToOptions**(`f`): [`PinchZoomOptions`](../interfaces/PinchZoomOptions.md)

Inverse of [optionsToForm](pinchZoomOptionsToForm.md): fold the flat fields back to a serialisable
[PinchZoomOptions](../interfaces/PinchZoomOptions.md) patch. Only fields the form actually set are included
(no `undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`.

## Parameters

### f

[`PinchZoomFields`](../interfaces/PinchZoomFields.md)

## Returns

[`PinchZoomOptions`](../interfaces/PinchZoomOptions.md)
