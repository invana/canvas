# Function: useHistory()

> **useHistory**(`options?`, `canvas?`): [`UseHistoryResult`](../interfaces/UseHistoryResult.md)

Undo/redo + redraw, wired to the `GraphHistory` from a
`<GraphHistoryProvider>` ancestor. `canUndo`/`canRedo` stay reactive via the
history's `change` event. Without a provider, undo/redo are no-ops and the
flags are `false` (redraw still works — it goes straight to the layer).

## Parameters

### options?

[`UseHistoryOptions`](../interfaces/UseHistoryOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseHistoryResult`](../interfaces/UseHistoryResult.md)
