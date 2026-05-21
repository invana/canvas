# Interface: NodeInput\<D\>

Defined in: [graph/src/layer/types.ts:1003](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1003)

What the consumer passes to `GraphLayer.setData`. Same shape as
[NodeData](NodeData.md) but with Resolvable fields — `id` and per-field styles
may be functions over `data`. Resolvers fire once at insert; the store
holds `NodeData`.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1006](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1006)

***

### id?

> `readonly` `optional` **id?**: [`ResolvableId`](../type-aliases/ResolvableId.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1004](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1004)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:1012](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1012)

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:1011](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1011)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:1010](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1010)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>\>\>

Defined in: [graph/src/layer/types.ts:1008](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1008)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1009](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1009)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1007](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1007)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1005](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1005)
