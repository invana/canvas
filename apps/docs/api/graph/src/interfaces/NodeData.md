# Interface: NodeData\<D\>

Defined in: [graph/src/layer/types.ts:974](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L974)

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

Defined in: [graph/src/layer/types.ts:978](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L978)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:975](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L975)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:994](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L994)

Logical parent id — the only hierarchy field. Use this for both tree
structures AND group/combo membership (the parent is just a regular
node that visually represents the group). The store auto-maintains an
inverse index, queryable via `store.childrenOf(id)` /
`store.descendantsOf(id)`.

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:986](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L986)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:985](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L985)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`NodeStyle`](NodeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:981](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L981)

Per-instance overlay catalogue (singular `state`).

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:983](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L983)

Currently-active state names (plural `states`).

***

### style?

> `readonly` `optional` **style?**: [`NodeStyle`](NodeStyle.md)

Defined in: [graph/src/layer/types.ts:979](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L979)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:977](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L977)

Type tag (free-form). Matches a `NodeOption` template if any.
