# Function: useEditorSection()

> **useEditorSection**(`options?`): `ToolbarItem`[]

**Editor** toolbar section — cut / copy / paste / erase ToolbarItems
built off [useClipboard](useClipboard.md) + [useClearGraph](useClearGraph.md). Cut/copy disable
without a selection, paste until something is copied. Erase is selection-aware
— it deletes the selection (with a "Selection" label) when something is
selected, otherwise clears the whole layer. Requires a
`<GraphClipboardProvider>` + `ClickSelectBehaviour`; edits are undoable with a
`<GraphHistoryProvider>`. Restrict the set via [UseEditorSectionOptions.items](../interfaces/UseEditorSectionOptions.md#items)
— e.g. `items: ['erase']` for an erase-only bar with no clipboard controls.

## Parameters

### options?

[`UseEditorSectionOptions`](../interfaces/UseEditorSectionOptions.md) = `{}`

## Returns

`ToolbarItem`[]
