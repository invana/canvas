# Function: parallelEdgeFormToOptions()

> **parallelEdgeFormToOptions**(`f`): [`ParallelEdgeOptions`](../interfaces/ParallelEdgeOptions.md)

Inverse of [optionsToForm](parallelEdgeOptionsToForm.md): fold the flat fields back to a serialisable
[ParallelEdgeOptions](../interfaces/ParallelEdgeOptions.md) patch. Only fields the form actually set are
included (no `undefined` keys), so the result is safe to spread over the
behaviour's current options on `setOptions`.

## Parameters

### f

[`ParallelEdgeOptions`](../interfaces/ParallelEdgeOptions.md)

## Returns

[`ParallelEdgeOptions`](../interfaces/ParallelEdgeOptions.md)
