# Interface: NodeInput\<D\>

Defined in: [graph/src/layer/types.ts:614](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L614)

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

Defined in: [graph/src/layer/types.ts:617](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L617)

***

### id?

> `readonly` `optional` **id?**: [`ResolvableId`](../type-aliases/ResolvableId.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:615](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L615)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:623](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L623)

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:622](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L622)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:621](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L621)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>\>\>

Defined in: [graph/src/layer/types.ts:619](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L619)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:620](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L620)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:618](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L618)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:616](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L616)
