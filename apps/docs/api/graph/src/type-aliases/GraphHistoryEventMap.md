# Type Alias: GraphHistoryEventMap

> **GraphHistoryEventMap** = `object`

Defined in: [graph/src/history/types.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L64)

Event-map for [GraphHistory.events](../classes/GraphHistory.md#events).

## Properties

### change

> **change**: `object`

Defined in: [graph/src/history/types.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L66)

Fired after every undo / redo / record / clear so observers can re-read state.

#### canRedo

> **canRedo**: `boolean`

#### canUndo

> **canUndo**: `boolean`

#### redoDepth

> **redoDepth**: `number`

#### undoDepth

> **undoDepth**: `number`
