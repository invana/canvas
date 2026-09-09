# Function: contextMenuOptionsToForm()

> **contextMenuOptionsToForm**(`o?`): [`ContextMenuFields`](../interfaces/ContextMenuFields.md)

Map a `ContextMenuBehaviourOptions`-shaped patch to the flat
[ContextMenuFields](../interfaces/ContextMenuFields.md) the `@invana/forms` generator renders. The `targets`
array is exploded into one boolean per kind; `state` (`string | null`) becomes
a text field (`null` → empty string).

## Parameters

### o?

[`ContextMenuOptions`](../interfaces/ContextMenuOptions.md) = `{}`

## Returns

[`ContextMenuFields`](../interfaces/ContextMenuFields.md)
