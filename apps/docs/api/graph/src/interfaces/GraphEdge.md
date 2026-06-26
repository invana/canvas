# Interface: GraphEdge\<D\>

Defined in: [graph/src/store/types.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L65)

A directed edge. Multi-edges between the same pair are allowed.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Defined in: [graph/src/store/types.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L75)

Arbitrary user payload — opaque to the store.

***

### id

> **id**: `string`

Defined in: [graph/src/store/types.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L67)

Stable identity. Must be unique within the store.

***

### source

> **source**: `string`

Defined in: [graph/src/store/types.ts:69](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L69)

Source node id.

***

### state?

> `optional` **state?**: `unknown`

Defined in: [graph/src/store/types.ts:81](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L81)

Per-instance overlay catalogue. Typed by consumer as `Record<string, EdgeStyle>`.

***

### states?

> `optional` **states?**: readonly `string`[]

Defined in: [graph/src/store/types.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L77)

Sibling of [GraphNode.states](GraphNode.md#states) — currently-active state names.

***

### style?

> `optional` **style?**: `unknown`

Defined in: [graph/src/store/types.ts:79](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L79)

Per-instance style. Typed by consumer as `EdgeStyle`.

***

### target

> **target**: `string`

Defined in: [graph/src/store/types.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L71)

Target node id.

***

### type?

> `optional` **type?**: `string`

Defined in: [graph/src/store/types.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L73)

Predicate / FK label / "calls" / "depends-on" — free-form.
