# Function: useHistory()

> **useHistory**(`options?`, `canvas?`): [`UseHistoryResult`](../interfaces/UseHistoryResult.md)

Defined in: [canvas-react/src/hooks/useHistory.ts:37](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L37)

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
