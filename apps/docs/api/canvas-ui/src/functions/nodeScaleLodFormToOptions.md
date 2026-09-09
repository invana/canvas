# Function: nodeScaleLodFormToOptions()

> **nodeScaleLodFormToOptions**(`f`): [`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md)

Inverse of [optionsToForm](nodeScaleLodOptionsToForm.md): fold the flat fields back to a serialisable
[NodeScaleLODOptions](../interfaces/NodeScaleLODOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions` — leaving `layers[]` untouched.

## Parameters

### f

[`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md)

## Returns

[`NodeScaleLODOptions`](../interfaces/NodeScaleLODOptions.md)
