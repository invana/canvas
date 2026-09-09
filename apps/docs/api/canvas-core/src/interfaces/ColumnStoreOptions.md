# Interface: ColumnStoreOptions

## Properties

### initialCapacity?

> `optional` **initialCapacity?**: `number`

Initial slot capacity. Doubles on overflow. Default 256.

***

### maxCapacity?

> `optional` **maxCapacity?**: `number`

Max capacity. Throws on overflow. Default 16_777_216 (~16M).
