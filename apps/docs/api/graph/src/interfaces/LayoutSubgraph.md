# Interface: LayoutSubgraph

The node/edge set handed to [SubgraphPositionLayout.computeSubgraphLayout](../classes/SubgraphPositionLayout.md#computesubgraphlayout).

A subgraph is self-contained: every edge's endpoints are in `ids`, and every
id has a size. When the run is nested, `groupId` names the group whose members
these are — a layout may use it for messages, but must not read the store
through it (the point of the snapshot is that it doesn't have to).

## Properties

### edges

> `readonly` **edges**: readonly [`LayoutEdge`](LayoutEdge.md)[]

Edges between `ids`. Deduplicated; no self-loops.

***

### groupId?

> `readonly` `optional` **groupId?**: `string`

The group these nodes are members of; `undefined` at the top level.

***

### ids

> `readonly` **ids**: readonly `string`[]

The nodes to place. Never empty.

## Methods

### dataOf()

> **dataOf**(`id`): `unknown`

The node's opaque `data` payload — what value accessors read (circle-pack
sizing, sunburst weights). Kept on the snapshot so a layout never needs the
store to reach it.

#### Parameters

##### id

`string`

#### Returns

`unknown`

***

### getPosition()

> **getPosition**(`id`): `Vec2`

Current position of `id`, when it has one (for layouts that seed from it).

#### Parameters

##### id

`string`

#### Returns

`Vec2`

***

### isGroup()

> **isGroup**(`id`): `boolean`

Whether `id` is a group container rather than an ordinary node.

A layout that derives topology from *edges* needs this: a group frame has
no edges of its own, so an algorithm that treats every id as part of the
edge graph will read it as a disconnected component (a second tree root, an
isolated cluster) and either fail or place it nonsensically. Layouts that
only place boxes can ignore it.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### sizeOf()

> **sizeOf**(`id`): [`LayoutNodeSize`](LayoutNodeSize.md)

The footprint to reserve for `id`. For a nested group this is the **box**
computed from its members, not the frame's stored size.

#### Parameters

##### id

`string`

#### Returns

[`LayoutNodeSize`](LayoutNodeSize.md)
