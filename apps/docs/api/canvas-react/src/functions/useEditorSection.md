# Function: useEditorSection()

> **useEditorSection**(`options?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/hooks/useEditorSection.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useEditorSection.ts#L26)

**Editor** toolbar section — cut / copy / paste / erase [ToolbarItem](../type-aliases/ToolbarItem.md)s
built off [useClipboard](useClipboard.md) + [useClearGraph](useClearGraph.md). Cut/copy disable
without a selection, paste until something is copied. Erase is selection-aware
— it deletes the selection (with a "Selection" label) when something is
selected, otherwise clears the whole layer. Requires a
`<GraphClipboardProvider>` + `ClickSelectBehaviour`; edits are undoable with a
`<GraphHistoryProvider>`.

## Parameters

### options?

[`UseEditorSectionOptions`](../interfaces/UseEditorSectionOptions.md) = `{}`

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
