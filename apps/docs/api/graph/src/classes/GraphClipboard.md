# Class: GraphClipboard

Defined in: [graph/src/clipboard/GraphClipboard.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L57)

## Constructors

### Constructor

> **new GraphClipboard**(`store`, `opts?`): `GraphClipboard`

Defined in: [graph/src/clipboard/GraphClipboard.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L68)

#### Parameters

##### store

[`GraphStore`](GraphStore.md)

##### opts?

[`GraphClipboardOptions`](../interfaces/GraphClipboardOptions.md) = `{}`

#### Returns

`GraphClipboard`

## Properties

### events

> `readonly` **events**: `EventEmitter`\<[`GraphClipboardEventMap`](../type-aliases/GraphClipboardEventMap.md)\>

Defined in: [graph/src/clipboard/GraphClipboard.ts:59](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L59)

Fires `change` whenever the buffer's contents change (copy / clear).

## Accessors

### hasContent

#### Get Signature

> **get** **hasContent**(): `boolean`

Defined in: [graph/src/clipboard/GraphClipboard.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L75)

True iff the buffer holds at least one node or edge (drives "can paste").

##### Returns

`boolean`

## Methods

### clearBuffer()

> **clearBuffer**(): `void`

Defined in: [graph/src/clipboard/GraphClipboard.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L80)

Empty the buffer.

#### Returns

`void`

***

### copy()

> **copy**(`nodeIds`, `edgeIds?`): `void`

Defined in: [graph/src/clipboard/GraphClipboard.ts:90](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L90)

Snapshot the given ids into the buffer (clones, so later store mutations
don't mutate the buffer). Unknown ids are skipped. Replaces prior contents.

#### Parameters

##### nodeIds

readonly `string`[]

##### edgeIds?

readonly `string`[] = `[]`

#### Returns

`void`

***

### cut()

> **cut**(`nodeIds`, `edgeIds`, `history?`): `void`

Defined in: [graph/src/clipboard/GraphClipboard.ts:105](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L105)

Copy the ids into the buffer, then delete them as one undoable transaction.

#### Parameters

##### nodeIds

readonly `string`[]

##### edgeIds

readonly `string`[]

##### history?

[`GraphHistory`](GraphHistory.md)

#### Returns

`void`

***

### delete()

> **delete**(`nodeIds`, `edgeIds`, `history?`): `void`

Defined in: [graph/src/clipboard/GraphClipboard.ts:111](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L111)

Delete the given ids as one undoable transaction. Buffer is left untouched.

#### Parameters

##### nodeIds

readonly `string`[]

##### edgeIds

readonly `string`[]

##### history?

[`GraphHistory`](GraphHistory.md)

#### Returns

`void`

***

### paste()

> **paste**(`history?`): [`PasteResult`](../interfaces/PasteResult.md)

Defined in: [graph/src/clipboard/GraphClipboard.ts:123](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/clipboard/GraphClipboard.ts#L123)

Insert the buffer with fresh ids (collision-free) and a position offset, as
one undoable transaction. Only buffered edges whose **both** endpoints were
also buffered are pasted, with endpoints remapped to the new node ids.
`parentId` is remapped when the parent was pasted too, else dropped.

Returns the new ids so the caller can re-select the pasted items.

#### Parameters

##### history?

[`GraphHistory`](GraphHistory.md)

#### Returns

[`PasteResult`](../interfaces/PasteResult.md)
