# Type Alias: GraphHistoryEventMap

> **GraphHistoryEventMap** = `object`

Event-map for [GraphHistory.events](../classes/GraphHistory.md#events).

## Properties

### change

> **change**: `object`

Fired after every undo / redo / record / clear so observers can re-read state.

#### canRedo

> **canRedo**: `boolean`

#### canUndo

> **canUndo**: `boolean`

#### redoDepth

> **redoDepth**: `number`

#### undoDepth

> **undoDepth**: `number`
