# Function: d3ForceLayoutFormToOptions()

> **d3ForceLayoutFormToOptions**(`f`): [`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)

Inverse of [optionsToForm](d3ForceLayoutOptionsToForm.md): fold the flat fields back to a serialisable
[D3ForceLayoutOptions](../interfaces/D3ForceLayoutOptions.md) patch. Only fields the form set are included, and
each nested force group is reassembled only when at least one of its members
is set — so the result is safe to spread over the layout's current options.

## Parameters

### f

[`D3ForceLayoutFields`](../interfaces/D3ForceLayoutFields.md)

## Returns

[`D3ForceLayoutOptions`](../interfaces/D3ForceLayoutOptions.md)
