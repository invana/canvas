# Interface: GraphNode\<D\>

A node in the graph. `id` is unique within a `GraphStore`.

## Type Parameters

### D

`D` = `unknown`

## Properties

### boundingBox?

> `optional` **boundingBox?**: `object`

Cached **local render bounds** (`width` × `height`), written by the
`GraphLayer` after each render via `GraphStore.setNodeBoundingBox`. Derived
— *not* user input; it's the size the shape's `boundsOf` reported, so
layouts (ELK collide/sizing, force radii) can read a node's footprint
without recomputing its shape spec (which, for a composite card, means
rebuilding every part). `undefined` until the node has rendered once.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### data?

> `optional` **data?**: `D`

Arbitrary user payload — opaque to the store.

***

### hidden?

> `optional` **hidden?**: `boolean`

True iff this node is explicitly hidden. A hidden node is culled from the
render batch, hit-test, bounds/camera, layout, labels and minimap — it is
*not* merely alpha-0. Sibling of [pinned](#pinned); stored as a bit in the
hot `flags` column, not on the cold record. Hiding a node also makes its
incident edges *effectively* hidden without flagging them (see
`GraphStore.isEdgeVisible`). Default `false`.

***

### id

> **id**: `string`

Stable identity. Must be unique within the store.

***

### parentId?

> `optional` **parentId?**: `string`

Logical parent. Cycles are rejected at write time.

***

### pinned?

> `optional` **pinned?**: `boolean`

True iff layouts must not move this node.

***

### position?

> `optional` **position?**: `object`

Canonical position. Owned by the store; mutated by layouts and drags.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### state?

> `optional` **state?**: `unknown`

Per-instance overlay catalogue keyed by state name (singular `state`).
Each value is a `NodeStyle` patch applied when that name appears in
[states](#states). Typed by the consumer as
`Readonly<Record<string, NodeStyle>>`.

***

### states?

> `optional` **states?**: readonly `string`[]

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

Visual + structural style for this node. Typed via
`import('../layer/types').NodeStyle` in consumer code; left as `unknown`
here to avoid a store → layer dependency cycle.

***

### type

> **type**: `string`

Type tag — matches a `NodeOption.type` template if any. Free-form.

**Required.** Every record carries one; where a graph has no meaningful
kinds, use [UNKNOWN\_TYPE](../variables/UNKNOWN_TYPE.md).
