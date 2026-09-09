# Function: dragPanFormToOptions()

> **dragPanFormToOptions**(`f`): [`DragPanOptions`](../interfaces/DragPanOptions.md)

Inverse of [optionsToForm](dragPanOptionsToForm.md): fold the flat fields back to a serialisable
[DragPanOptions](../interfaces/DragPanOptions.md) patch. Only fields the form actually set are included
(no `undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`.

## Parameters

### f

[`DragPanFields`](../interfaces/DragPanFields.md)

## Returns

[`DragPanOptions`](../interfaces/DragPanOptions.md)
