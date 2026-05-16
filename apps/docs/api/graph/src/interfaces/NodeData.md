# Interface: NodeData\<D\>

Defined in: [graph/src/layer/types.ts:585](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L585)

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

Defined in: [graph/src/layer/types.ts:589](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L589)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:586](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L586)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:605](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L605)

Logical parent id — the only hierarchy field. Use this for both tree
structures AND group/combo membership (the parent is just a regular
node that visually represents the group). The store auto-maintains an
inverse index, queryable via `store.childrenOf(id)` /
`store.descendantsOf(id)`.

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:597](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L597)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:596](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L596)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`NodeStyle`](NodeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:592](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L592)

Per-instance overlay catalogue (singular `state`).

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:594](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L594)

Currently-active state names (plural `states`).

***

### style?

> `readonly` `optional` **style?**: [`NodeStyle`](NodeStyle.md)

Defined in: [graph/src/layer/types.ts:590](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L590)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:588](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L588)

Type tag (free-form). Matches a `NodeOption` template if any.
