# Function: edgeLODFormToOptions()

> **edgeLODFormToOptions**(`f`): [`EdgeLODOptions`](../interfaces/EdgeLODOptions.md)

Inverse of [optionsToForm](edgeLODOptionsToForm.md): fold the flat fields back to a serialisable
[EdgeLODOptions](../interfaces/EdgeLODOptions.md) patch, omitting unset keys so it's safe to spread over
the behaviour's current options on `setOptions`.

## Parameters

### f

[`EdgeLODOptions`](../interfaces/EdgeLODOptions.md)

## Returns

[`EdgeLODOptions`](../interfaces/EdgeLODOptions.md)
