# Function: edgeScaleLodFormToOptions()

> **edgeScaleLodFormToOptions**(`f`): [`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md)

Inverse of [optionsToForm](edgeScaleLodOptionsToForm.md): fold the flat fields back to a serialisable
[EdgeScaleLODOptions](../interfaces/EdgeScaleLODOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions` — leaving `layers[]` untouched.

## Parameters

### f

[`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md)

## Returns

[`EdgeScaleLODOptions`](../interfaces/EdgeScaleLODOptions.md)
