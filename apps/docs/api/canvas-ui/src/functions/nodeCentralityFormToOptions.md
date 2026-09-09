# Function: nodeCentralityFormToOptions()

> **nodeCentralityFormToOptions**(`f`): [`NodeCentralityOptions`](../interfaces/NodeCentralityOptions.md)

Inverse of [optionsToForm](nodeCentralityOptionsToForm.md): fold the flat fields back to a serialisable
[NodeCentralityOptions](../interfaces/NodeCentralityOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`.

## Parameters

### f

[`NodeCentralityOptions`](../interfaces/NodeCentralityOptions.md)

## Returns

[`NodeCentralityOptions`](../interfaces/NodeCentralityOptions.md)
