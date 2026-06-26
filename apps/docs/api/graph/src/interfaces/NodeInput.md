# Interface: NodeInput\<D\>

Defined in: [graph/src/layer/types.ts:1056](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1056)

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

Defined in: [graph/src/layer/types.ts:1059](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1059)

***

### id?

> `readonly` `optional` **id?**: [`ResolvableId`](../type-aliases/ResolvableId.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1057](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1057)

***

### parentId?

> `readonly` `optional` **parentId?**: `string`

Defined in: [graph/src/layer/types.ts:1065](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1065)

***

### pinned?

> `readonly` `optional` **pinned?**: `boolean`

Defined in: [graph/src/layer/types.ts:1064](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1064)

***

### position?

> `readonly` `optional` **position?**: `object`

Defined in: [graph/src/layer/types.ts:1063](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1063)

#### x

> `readonly` **x**: `number`

#### y

> `readonly` **y**: `number`

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>\>\>

Defined in: [graph/src/layer/types.ts:1061](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1061)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1062](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1062)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableNodeStyle`](../type-aliases/ResolvableNodeStyle.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1060](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1060)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1058](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1058)
