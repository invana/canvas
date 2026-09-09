# Function: colorByFormToOptions()

> **colorByFormToOptions**(`f`): [`ColorByOptions`](../interfaces/ColorByOptions.md)

Inverse of [optionsToForm](colorByOptionsToForm.md): fold the flat fields back to a serialisable
[ColorByOptions](../interfaces/ColorByOptions.md) patch. Only fields the form actually set are included,
so the result is safe to spread on `setOptions`.

A domain is emitted **only when both bounds are present** — a half-filled
domain is a mid-edit state, not an instruction, and emitting it would pin one
end of the scale to `undefined`. Both blank therefore means auto-scan, which
is what the field description promises.

## Parameters

### f

[`ColorByFields`](../interfaces/ColorByFields.md)

## Returns

[`ColorByOptions`](../interfaces/ColorByOptions.md)
