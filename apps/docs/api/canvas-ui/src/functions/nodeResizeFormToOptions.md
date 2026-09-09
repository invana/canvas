# Function: nodeResizeFormToOptions()

> **nodeResizeFormToOptions**(`f`): [`NodeResizeOptions`](../interfaces/NodeResizeOptions.md)

Inverse of [optionsToForm](nodeResizeOptionsToForm.md): fold the flat fields back to a serialisable
[NodeResizeOptions](../interfaces/NodeResizeOptions.md) patch. Swatch strings become engine numbers; the two
dash fields are re-fused into the `dashArray` tuple (only when at least one is
set). Only fields the form actually set are included (no `undefined` keys), so
the result is safe to spread over the behaviour's current options on
`setOptions`.

## Parameters

### f

[`NodeResizeFields`](../interfaces/NodeResizeFields.md)

## Returns

[`NodeResizeOptions`](../interfaces/NodeResizeOptions.md)
