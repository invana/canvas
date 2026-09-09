# Interface: HistoryEntry

One undoable unit of work — a labelled, ordered list of [HistoryOp](../type-aliases/HistoryOp.md)s.

## Properties

### label?

> `optional` **label?**: `string`

Human label for the change (e.g. `'delete selection'`, `'paste'`).

***

### ops

> **ops**: [`HistoryOp`](../type-aliases/HistoryOp.md)[]

Ops in application order. Undo replays inverses in reverse; redo replays forward.
