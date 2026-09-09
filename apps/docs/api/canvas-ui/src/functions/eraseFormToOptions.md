# Function: eraseFormToOptions()

> **eraseFormToOptions**(`f`): [`EraseOptions`](../interfaces/EraseOptions.md)

Inverse of [optionsToForm](eraseOptionsToForm.md): fold the flat fields back to a serialisable
[EraseOptions](../interfaces/EraseOptions.md) patch. Only fields the form actually set are included, so
the result is safe to spread on `setOptions`.

## Parameters

### f

[`EraseFields`](../interfaces/EraseFields.md)

## Returns

[`EraseOptions`](../interfaces/EraseOptions.md)
