# Class: GraphHistory

Defined in: [graph/src/history/GraphHistory.ts:34](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L34)

## Constructors

### Constructor

> **new GraphHistory**(`store`, `opts?`): `GraphHistory`

Defined in: [graph/src/history/GraphHistory.ts:49](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L49)

#### Parameters

##### store

[`GraphStore`](GraphStore.md)

##### opts?

[`GraphHistoryOptions`](../interfaces/GraphHistoryOptions.md) = `{}`

#### Returns

`GraphHistory`

## Properties

### events

> `readonly` **events**: `EventEmitter`\<[`GraphHistoryEventMap`](../type-aliases/GraphHistoryEventMap.md)\>

Defined in: [graph/src/history/GraphHistory.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L36)

Fires `change` after every mutation so observers can re-read undo/redo state.

## Accessors

### canRedo

#### Get Signature

> **get** **canRedo**(): `boolean`

Defined in: [graph/src/history/GraphHistory.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L62)

True iff there is at least one undone entry that can be redone.

##### Returns

`boolean`

***

### canUndo

#### Get Signature

> **get** **canUndo**(): `boolean`

Defined in: [graph/src/history/GraphHistory.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L57)

True iff there is at least one entry that can be undone.

##### Returns

`boolean`

## Methods

### clear()

> **clear**(): `void`

Defined in: [graph/src/history/GraphHistory.ts:129](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L129)

Wipe both stacks. Use when loading a fresh dataset.

#### Returns

`void`

***

### push()

> **push**(`entry`): `void`

Defined in: [graph/src/history/GraphHistory.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L99)

Record an already-applied entry. Escape hatch for mutations that happen
outside [transaction](#transaction) — e.g. a drag behaviour that writes positions
during the gesture and, on release, pushes a single `moveNode` op with the
captured start/end positions. The ops are assumed to be applied already;
this only journals them.

#### Parameters

##### entry

[`HistoryEntry`](../interfaces/HistoryEntry.md)

#### Returns

`void`

***

### redo()

> **redo**(): `void`

Defined in: [graph/src/history/GraphHistory.ts:118](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L118)

Re-apply the most recently undone entry and move it back onto the undo stack.

#### Returns

`void`

***

### transaction()

> **transaction**\<`T`\>(`label`, `fn`): `T`

Defined in: [graph/src/history/GraphHistory.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L74)

Run `fn`'s mutations as one undoable entry. Mutations MUST go through the
[HistoryRecorder](../interfaces/HistoryRecorder.md) passed to `fn` to be journaled. The whole body runs
inside [GraphStore.batch](GraphStore.md#batch), so the canvas sees a single flush. Nested
`transaction` calls merge into the outermost entry. Returns `fn`'s result.

#### Type Parameters

##### T

`T`

#### Parameters

##### label

`string`

##### fn

(`rec`) => `T`

#### Returns

`T`

***

### undo()

> **undo**(): `void`

Defined in: [graph/src/history/GraphHistory.ts:107](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/history/GraphHistory.ts#L107)

Revert the most recent entry and move it onto the redo stack. No-op if empty.

#### Returns

`void`
