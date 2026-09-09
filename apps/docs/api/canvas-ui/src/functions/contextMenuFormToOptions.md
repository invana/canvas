# Function: contextMenuFormToOptions()

> **contextMenuFormToOptions**(`f`): [`ContextMenuOptions`](../interfaces/ContextMenuOptions.md)

Inverse of [optionsToForm](contextMenuOptionsToForm.md): fold the flat fields back to a serialisable
[ContextMenuOptions](../interfaces/ContextMenuOptions.md) patch. Only fields the form actually set are
included, so the result is safe to spread on `setOptions`. The `targets` array
is reassembled only when at least one target toggle was set; a blank `state`
maps back to `null` (disabled).

## Parameters

### f

[`ContextMenuFields`](../interfaces/ContextMenuFields.md)

## Returns

[`ContextMenuOptions`](../interfaces/ContextMenuOptions.md)
