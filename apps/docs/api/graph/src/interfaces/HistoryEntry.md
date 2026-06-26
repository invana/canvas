# Interface: HistoryEntry

Defined in: [graph/src/history/types.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L34)

One undoable unit of work — a labelled, ordered list of [HistoryOp](../type-aliases/HistoryOp.md)s.

## Properties

### label?

> `optional` **label?**: `string`

Defined in: [graph/src/history/types.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L38)

Human label for the change (e.g. `'delete selection'`, `'paste'`).

***

### ops

> **ops**: [`HistoryOp`](../type-aliases/HistoryOp.md)[]

Defined in: [graph/src/history/types.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/types.ts#L36)

Ops in application order. Undo replays inverses in reverse; redo replays forward.
