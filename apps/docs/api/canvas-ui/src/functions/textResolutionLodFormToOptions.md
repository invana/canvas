# Function: textResolutionLodFormToOptions()

> **textResolutionLodFormToOptions**(`f`): [`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md)

Inverse of [optionsToForm](textResolutionLodOptionsToForm.md): fold the flat fields back to a serialisable
[TextResolutionLODOptions](../interfaces/TextResolutionLODOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions` — leaving `levels[]` untouched.

## Parameters

### f

[`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md)

## Returns

[`TextResolutionLODOptions`](../interfaces/TextResolutionLODOptions.md)
