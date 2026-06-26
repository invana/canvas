# Interface: GraphNode\<D\>

Defined in: [graph/src/store/types.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L20)

A node in the graph. `id` is unique within a `GraphStore`.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `optional` **data?**: `D`

Defined in: [graph/src/store/types.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L26)

Arbitrary user payload — opaque to the store.

***

### id

> **id**: `string`

Defined in: [graph/src/store/types.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L22)

Stable identity. Must be unique within the store.

***

### parentId?

> `optional` **parentId?**: `string`

Defined in: [graph/src/store/types.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L28)

Logical parent. Cycles are rejected at write time.

***

### pinned?

> `optional` **pinned?**: `boolean`

Defined in: [graph/src/store/types.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L32)

True iff layouts must not move this node.

***

### position?

> `optional` **position?**: `object`

Defined in: [graph/src/store/types.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L30)

Canonical position. Owned by the store; mutated by layouts and drags.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### state?

> `optional` **state?**: `unknown`

Defined in: [graph/src/store/types.ts:61](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L61)

Per-instance overlay catalogue keyed by state name (singular `state`).
Each value is a `NodeStyle` patch applied when that name appears in
[states](#states). Typed by the consumer as
`Readonly<Record<string, NodeStyle>>`.

***

### states?

> `optional` **states?**: readonly `string`[]

Defined in: [graph/src/store/types.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L46)

Currently-active state names (plural). Each name should match a key in
`style.state` (per-instance overlay catalogue) or in
`GraphLayerOptions.node.state` (layer-level catalogue).

The store treats this field as opaque metadata. The layer reads it on
insert and update to toggle visual states via `setNodeState`. On
update with `states` present in the patch the layer REPLACES the
visible state set with the new array — runtime states applied via
`setNodeState` (e.g. hover) are wiped. Pass an empty array (or
`null`) to clear.

***

### style?

> `optional` **style?**: `unknown`

Defined in: [graph/src/store/types.ts:53](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L53)

Visual + structural style for this node. Typed via
`import('../layer/types').NodeStyle` in consumer code; left as `unknown`
here to avoid a store → layer dependency cycle.

***

### type?

> `optional` **type?**: `string`

Defined in: [graph/src/store/types.ts:24](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/store/types.ts#L24)

Type tag — matches a `NodeOption.type` template if any. Free-form.
