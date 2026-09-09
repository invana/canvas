# Function: dragNodeFormToOptions()

> **dragNodeFormToOptions**(`f`): [`DragNodeOptions`](../interfaces/DragNodeOptions.md)

Inverse of [optionsToForm](dragNodeOptionsToForm.md): fold the flat fields back to a serialisable
[DragNodeOptions](../interfaces/DragNodeOptions.md) patch. Only fields the form actually set are included
(no `undefined` keys), so the result is safe to spread over the behaviour's
current options on `setOptions`.

## Parameters

### f

[`DragNodeFields`](../interfaces/DragNodeFields.md)

## Returns

[`DragNodeOptions`](../interfaces/DragNodeOptions.md)
