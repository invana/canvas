# Class: GraphHistory

## Constructors

### Constructor

> **new GraphHistory**(`store`, `opts?`): `GraphHistory`

#### Parameters

##### store

[`GraphStore`](GraphStore.md)

##### opts?

[`GraphHistoryOptions`](../interfaces/GraphHistoryOptions.md) = `{}`

#### Returns

`GraphHistory`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`GraphHistoryEventMap`](../type-aliases/GraphHistoryEventMap.md)\>

Fires `change` after every mutation so observers can re-read undo/redo state.

## Accessors

### canRedo

#### Get Signature

> **get** **canRedo**(): `boolean`

True iff there is at least one undone entry that can be redone.

##### Returns

`boolean`

***

### canUndo

#### Get Signature

> **get** **canUndo**(): `boolean`

True iff there is at least one entry that can be undone.

##### Returns

`boolean`

## Methods

### clear()

> **clear**(): `void`

Wipe both stacks. Use when loading a fresh dataset.

#### Returns

`void`

***

### push()

> **push**(`entry`): `void`

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

Re-apply the most recently undone entry and move it back onto the undo stack.

#### Returns

`void`

***

### transaction()

> **transaction**\<`T`\>(`label`, `fn`): `T`

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

Revert the most recent entry and move it onto the redo stack. No-op if empty.

#### Returns

`void`
