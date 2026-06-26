# Function: useClipboard()

> **useClipboard**(`options?`, `canvas?`): [`UseClipboardResult`](../interfaces/UseClipboardResult.md)

Defined in: [canvas-react/src/hooks/useClipboard.ts:40](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L40)

Cut / copy / paste / delete for the current selection, wired to the
`GraphClipboard` from a `<GraphClipboardProvider>` ancestor. Operations route
through the `<GraphHistoryProvider>`'s history when present, so they're
undoable. Reads the selection (and re-selects pasted items) via a
`ClickSelectBehaviour`.

`canPaste` tracks the buffer (recomputed after each op); `hasSelection` is
reactive via [useSelection](useSelection.md).

## Parameters

### options?

[`UseClipboardOptions`](../interfaces/UseClipboardOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseClipboardResult`](../interfaces/UseClipboardResult.md)
