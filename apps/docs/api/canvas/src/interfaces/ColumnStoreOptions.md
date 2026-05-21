# Interface: ColumnStoreOptions

Defined in: [canvas/src/state/ColumnStore.ts:122](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/state/ColumnStore.ts#L122)

## Properties

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [canvas/src/state/ColumnStore.ts:124](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/state/ColumnStore.ts#L124)

Initial slot capacity. Doubles on overflow. Default 256.

***

### maxCapacity?

> `optional` **maxCapacity?**: `number`

Defined in: [canvas/src/state/ColumnStore.ts:126](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/state/ColumnStore.ts#L126)

Max capacity. Throws on overflow. Default 16_777_216 (~16M).
