# Function: d3SankeyLayoutFormToOptions()

> **d3SankeyLayoutFormToOptions**(`f`): [`D3SankeyLayoutOptions`](../interfaces/D3SankeyLayoutOptions.md)

Inverse of [optionsToForm](d3SankeyLayoutOptionsToForm.md): fold the flat fields back to a serialisable
[D3SankeyLayoutOptions](../interfaces/D3SankeyLayoutOptions.md) patch. Only fields the form set are included.
`size` is re-fused into a tuple only when **both** components are set (a tuple
needs both), and `center` when at least one of x/y is set — so the result is
safe to spread over the layout's current options.

## Parameters

### f

[`D3SankeyLayoutFields`](../interfaces/D3SankeyLayoutFields.md)

## Returns

[`D3SankeyLayoutOptions`](../interfaces/D3SankeyLayoutOptions.md)
