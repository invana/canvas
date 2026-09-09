# Interface: GraphEdge\<D\>

A directed edge. Multi-edges between the same pair are allowed.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Arbitrary user payload — opaque to the store.

***

### hidden?

> `optional` **hidden?**: `boolean`

True iff this edge is explicitly hidden. Sibling of [GraphNode.hidden](GraphNode.md#hidden)
(stored as a bit in the edge `flags` column). Note an edge is *effectively*
hidden when it is explicitly hidden **or** either endpoint is hidden — see
`GraphStore.isEdgeVisible`. Default `false`.

***

### id

> **id**: `string`

Stable identity. Must be unique within the store.

***

### source

> **source**: `string`

Source node id.

***

### state?

> `optional` **state?**: `unknown`

Per-instance overlay catalogue. Typed by consumer as `Record<string, EdgeStyle>`.

***

### states?

> `optional` **states?**: readonly `string`[]

Sibling of [GraphNode.states](GraphNode.md#states) — currently-active state names.

***

### style?

> `optional` **style?**: `unknown`

Per-instance style. Typed by consumer as `EdgeStyle`.

***

### target

> **target**: `string`

Target node id.

***

### type

> **type**: `string`

Predicate / FK label / "calls" / "depends-on" — free-form.

**Required.** Every record carries one; where a graph has no meaningful
predicates, use [UNKNOWN\_TYPE](../variables/UNKNOWN_TYPE.md).
