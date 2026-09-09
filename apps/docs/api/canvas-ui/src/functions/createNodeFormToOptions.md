# Function: createNodeFormToOptions()

> **createNodeFormToOptions**(`_f`): [`CreateNodeOptions`](../interfaces/CreateNodeOptions.md)

Inverse of [optionsToForm](createNodeOptionsToForm.md): fold the flat fields back to a serialisable
[CreateNodeOptions](../interfaces/CreateNodeOptions.md) patch. A no-op — the behaviour has no serialisable
scalars to round-trip.

## Parameters

### \_f

[`CreateNodeFields`](../interfaces/CreateNodeFields.md)

## Returns

[`CreateNodeOptions`](../interfaces/CreateNodeOptions.md)
