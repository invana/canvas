# Function: useDrawHistory()

> **useDrawHistory**(): [`UseDrawHistoryResult`](../interfaces/UseDrawHistoryResult.md)

Ready-made callbacks that make `CreateNodeBehaviour` / `DrawEdgeBehaviour` /
`EraseBehaviour` **undoable**. Wire them to the behaviours' `onNodeCreate` /
`onEdgeCreate` / `onErase` props — each pushes the already-applied mutation as
one entry on the `GraphHistory` from a `<GraphHistoryProvider>` ancestor
(mirroring how the provider records drags via `history.push`).

The behaviours mutate the store themselves; these only *journal* the change,
so they pair with — they don't replace — the behaviour's own mutation.

Without a history provider the callbacks are harmless no-ops (drawing still
works; it just isn't undoable). The returned functions are referentially
stable, so they're safe to capture once in a behaviour that reads its
callbacks at construction.

## Returns

[`UseDrawHistoryResult`](../interfaces/UseDrawHistoryResult.md)
