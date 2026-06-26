# Function: useClearGraph()

> **useClearGraph**(`layerId`, `canvas?`): [`UseClearGraphResult`](../interfaces/UseClearGraphResult.md)

Defined in: [canvas-react/src/hooks/useClearGraph.ts:40](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClearGraph.ts#L40)

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
