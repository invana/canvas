# Interface: ColumnStoreOptions

Defined in: [packages/canvas/src/state/ColumnStore.ts:122](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/ColumnStore.ts#L122)

## Properties

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:124](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/ColumnStore.ts#L124)

Initial slot capacity. Doubles on overflow. Default 256.

***

### maxCapacity?

> `optional` **maxCapacity?**: `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:126](https://github.com/invana/canvas/blob/1c7f4d3821ea03a7b4d27842859356b596bd4d78/packages/canvas/src/state/ColumnStore.ts#L126)

Max capacity. Throws on overflow. Default 16_777_216 (~16M).
