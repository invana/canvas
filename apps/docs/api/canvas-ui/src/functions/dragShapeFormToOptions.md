# Function: dragShapeFormToOptions()

> **dragShapeFormToOptions**(`f`): [`DragShapeOptions`](../interfaces/DragShapeOptions.md)

Inverse of [optionsToForm](dragShapeOptionsToForm.md): fold the flat fields back to a serialisable
[DragShapeOptions](../interfaces/DragShapeOptions.md) patch. Only fields the form actually set are included
(no `undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`.

## Parameters

### f

[`DragShapeFields`](../interfaces/DragShapeFields.md)

## Returns

[`DragShapeOptions`](../interfaces/DragShapeOptions.md)
