# Function: drawEdgeFormToOptions()

> **drawEdgeFormToOptions**(`f`): [`DrawEdgeOptions`](../interfaces/DrawEdgeOptions.md)

Inverse of [optionsToForm](drawEdgeOptionsToForm.md): fold the flat fields back to a serialisable
[DrawEdgeOptions](../interfaces/DrawEdgeOptions.md) patch. Only fields the form actually set are included,
so the result is safe to spread on `setOptions`. The `draftStyle` group is
reassembled only when at least one of its members was set; the hex colour is
re-encoded to a `0xRRGGBB` number and the dash pair re-fused into a tuple
(falling back to the engine defaults `[6, 4]` for a missing half).

## Parameters

### f

[`DrawEdgeFields`](../interfaces/DrawEdgeFields.md)

## Returns

[`DrawEdgeOptions`](../interfaces/DrawEdgeOptions.md)
