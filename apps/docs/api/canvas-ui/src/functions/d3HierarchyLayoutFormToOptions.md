# Function: d3HierarchyLayoutFormToOptions()

> **d3HierarchyLayoutFormToOptions**(`f`): [`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)

Inverse of [optionsToForm](d3HierarchyLayoutOptionsToForm.md): fold the flat fields back to a serialisable
[D3HierarchyLayoutOptions](../interfaces/D3HierarchyLayoutOptions.md) patch. Only fields the form set are included.
`size` / `nodeSize` are re-fused into tuples only when **both** components are
set (a tuple needs both), and `center` when at least one of x/y is set — so
the result is safe to spread over the layout's current options.

## Parameters

### f

[`D3HierarchyLayoutFields`](../interfaces/D3HierarchyLayoutFields.md)

## Returns

[`D3HierarchyLayoutOptions`](../interfaces/D3HierarchyLayoutOptions.md)
