# Function: contentLODFormToOptions()

> **contentLODFormToOptions**(`f`): [`ContentLODOptions`](../interfaces/ContentLODOptions.md)

Inverse of [optionsToForm](contentLODOptionsToForm.md): fold the flat fields back to a serialisable
[ContentLODOptions](../interfaces/ContentLODOptions.md) patch, omitting blank bounds so the result is safe
to spread over the behaviour's current options on `setOptions`.

## Parameters

### f

[`ContentLODOptions`](../interfaces/ContentLODOptions.md)

## Returns

[`ContentLODOptions`](../interfaces/ContentLODOptions.md)
