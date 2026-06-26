# Interface: NodeData\<D\>

Defined in: [graph/src/layer/types.ts:1027](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1027)

Per-instance node descriptor as stored by `GraphStore`. All values
concrete (no functions). Flat field layout matching G6's `NodeData`
convention.

- `state` (singular) = per-instance overlay catalogue.
- `states` (plural) = currently-active state names.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1031](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1031)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:1028](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1028)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:1047](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1047)

Logical parent id — the only hierarchy field. Use this for both tree
structures AND group/combo membership (the parent is just a regular
node that visually represents the group). The store auto-maintains an
inverse index, queryable via `store.childrenOf(id)` /
`store.descendantsOf(id)`.

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:1039](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1039)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:1038](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1038)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`NodeStyle`](NodeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:1034](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1034)

Per-instance overlay catalogue (singular `state`).

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1036](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1036)

Currently-active state names (plural `states`).

***

### style?

> `readonly` `optional` **style?**: [`NodeStyle`](NodeStyle.md)

Defined in: [graph/src/layer/types.ts:1032](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1032)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1030](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1030)

Type tag (free-form). Matches a `NodeOption` template if any.
