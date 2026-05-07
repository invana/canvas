# Interface: ColumnStoreOptions

Defined in: [packages/canvas/src/state/ColumnStore.ts:122](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/state/ColumnStore.ts#L122)

## Properties

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:124](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/state/ColumnStore.ts#L124)

Initial slot capacity. Doubles on overflow. Default 256.

***

### maxCapacity?

> `optional` **maxCapacity?**: `number`

Defined in: [packages/canvas/src/state/ColumnStore.ts:126](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/state/ColumnStore.ts#L126)

Max capacity. Throws on overflow. Default 16_777_216 (~16M).
