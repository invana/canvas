# Interface: GraphEdge\<D\>

Defined in: packages/graph/src/store/types.ts:23

A directed edge. Multi-edges between the same pair are allowed.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Defined in: packages/graph/src/store/types.ts:33

Arbitrary user payload — opaque to the store.

***

### id

> **id**: `string`

Defined in: packages/graph/src/store/types.ts:25

Stable identity. Must be unique within the store.

***

### source

> **source**: `string`

Defined in: packages/graph/src/store/types.ts:27

Source node id.

***

### target

> **target**: `string`

Defined in: packages/graph/src/store/types.ts:29

Target node id.

***

### type?

> `optional` **type?**: `string`

Defined in: packages/graph/src/store/types.ts:31

Predicate / FK label / "calls" / "depends-on" — free-form.
