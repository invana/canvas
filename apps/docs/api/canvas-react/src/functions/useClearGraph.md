# Function: useClearGraph()

> **useClearGraph**(`layerId`, `canvas?`): [`UseClearGraphResult`](../interfaces/UseClearGraphResult.md)

Clear-graph action for a specific layer on the resolved canvas.

When a `<GraphHistoryProvider>` is present, the clear runs as a single
undoable `history.transaction('clear', …)` — removing every node (edges
cascade) so Undo restores the whole graph and Redo clears it again. Without a
history provider it falls back to the layer's fast `clear()`.

Uses structural duck-types (`clear()` / `store.nodes()`) so it works with any
compatible layer without a hard `@invana/graph` import.

## Parameters

### layerId

`string`

Target layer id (e.g. `'graph'`).

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

[`UseClearGraphResult`](../interfaces/UseClearGraphResult.md)
