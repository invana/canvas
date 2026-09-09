# Class: GraphClipboard

## Constructors

### Constructor

> **new GraphClipboard**(`store`, `opts?`): `GraphClipboard`

#### Parameters

##### store

[`GraphStore`](GraphStore.md)

##### opts?

[`GraphClipboardOptions`](../interfaces/GraphClipboardOptions.md) = `{}`

#### Returns

`GraphClipboard`

## Properties

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`GraphClipboardEventMap`](../type-aliases/GraphClipboardEventMap.md)\>

Fires `change` whenever the buffer's contents change (copy / clear).

## Accessors

### hasContent

#### Get Signature

> **get** **hasContent**(): `boolean`

True iff the buffer holds at least one node or edge (drives "can paste").

##### Returns

`boolean`

## Methods

### clearBuffer()

> **clearBuffer**(): `void`

Empty the buffer.

#### Returns

`void`

***

### copy()

> **copy**(`nodeIds`, `edgeIds?`): `void`

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
