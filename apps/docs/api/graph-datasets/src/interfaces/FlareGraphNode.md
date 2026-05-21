# Interface: FlareGraphNode

Defined in: [graph-datasets/src/flare.ts:30](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare.ts#L30)

A single node in the flat projection. The id is the slash-joined path
 from the root (e.g. `flare/analytics/cluster/AgglomerativeCluster`) so
 it survives duplicate `name` values across branches.

## Properties

### data

> **data**: `object`

Defined in: [graph-datasets/src/flare.ts:32](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare.ts#L32)

#### depth

> **depth**: `number`

Depth from root. Root is 0.

#### group?

> `optional` **group?**: `string`

Top-level category — the depth-1 ancestor's name (e.g. `analytics`,
`animate`, `data`, ...). Depth-1 nodes carry their own name here;
the root (depth 0) carries `undefined`. Drives categorical colour
in the bubble-chart layout, since every leaf inherits the same
`group` as every other leaf under the same top-level branch.

#### isLeaf

> **isLeaf**: `boolean`

True iff this node has no children.

#### name

> **name**: `string`

Original `name` field. Convenient for labels once those land.

#### value?

> `optional` **value?**: `number`

Original `value` field, if present (only on leaves).

***

### id

> **id**: `string`

Defined in: [graph-datasets/src/flare.ts:31](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-datasets/src/flare.ts#L31)
