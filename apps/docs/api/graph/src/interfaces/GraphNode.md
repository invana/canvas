# Interface: GraphNode\<D\>

Defined in: packages/graph/src/store/types.ts:9

A node in the graph. `id` is unique within a `GraphStore`.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Defined in: packages/graph/src/store/types.ts:13

Arbitrary user payload — opaque to the store.

***

### id

> **id**: `string`

Defined in: packages/graph/src/store/types.ts:11

Stable identity. Must be unique within the store.

***

### parentId?

> `optional` **parentId?**: `string`

Defined in: packages/graph/src/store/types.ts:15

Logical parent. Cycles are rejected at write time.

***

### pinned?

> `optional` **pinned?**: `boolean`

Defined in: packages/graph/src/store/types.ts:19

True iff layouts must not move this node.

***

### position?

> `optional` **position?**: `object`

Defined in: packages/graph/src/store/types.ts:17

Canonical position. Owned by the store; mutated by layouts and drags.

#### x

> **x**: `number`

#### y

> **y**: `number`
