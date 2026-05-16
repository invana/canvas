# Interface: GraphEdge\<D\>

Defined in: [graph/src/store/types.ts:59](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L59)

A directed edge. Multi-edges between the same pair are allowed.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Defined in: [graph/src/store/types.ts:69](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L69)

Arbitrary user payload — opaque to the store.

***

### id

> **id**: `string`

Defined in: [graph/src/store/types.ts:61](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L61)

Stable identity. Must be unique within the store.

***

### source

> **source**: `string`

Defined in: [graph/src/store/types.ts:63](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L63)

Source node id.

***

### state?

> `optional` **state?**: `unknown`

Defined in: [graph/src/store/types.ts:75](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L75)

Per-instance overlay catalogue. Typed by consumer as `Record<string, EdgeStyle>`.

***

### states?

> `optional` **states?**: readonly `string`[]

Defined in: [graph/src/store/types.ts:71](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L71)

Sibling of [GraphNode.states](GraphNode.md#states) — currently-active state names.

***

### style?

> `optional` **style?**: `unknown`

Defined in: [graph/src/store/types.ts:73](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L73)

Per-instance style. Typed by consumer as `EdgeStyle`.

***

### target

> **target**: `string`

Defined in: [graph/src/store/types.ts:65](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L65)

Target node id.

***

### type?

> `optional` **type?**: `string`

Defined in: [graph/src/store/types.ts:67](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/store/types.ts#L67)

Predicate / FK label / "calls" / "depends-on" — free-form.
