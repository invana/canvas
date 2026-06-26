# Interface: ColumnStoreOptions

Defined in: [canvas/src/state/ColumnStore.ts:122](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/ColumnStore.ts#L122)

## Properties

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [canvas/src/state/ColumnStore.ts:124](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/ColumnStore.ts#L124)

Initial slot capacity. Doubles on overflow. Default 256.

***

### maxCapacity?

> `optional` **maxCapacity?**: `number`

Defined in: [canvas/src/state/ColumnStore.ts:126](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/state/ColumnStore.ts#L126)

Max capacity. Throws on overflow. Default 16_777_216 (~16M).
