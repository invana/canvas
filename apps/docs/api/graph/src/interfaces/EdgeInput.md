# Interface: EdgeInput\<D\>

Defined in: [graph/src/layer/types.ts:1172](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1172)

Resolver-aware input shape for an edge.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1177](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1177)

***

### id?

> `readonly` `optional` **id?**: [`ResolvableId`](../type-aliases/ResolvableId.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1173](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1173)

***

### source

> `readonly` **source**: `string`

Defined in: [graph/src/layer/types.ts:1174](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1174)

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<`D`\>\>\>

Defined in: [graph/src/layer/types.ts:1179](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1179)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1180](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1180)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1178](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1178)

***

### target

> `readonly` **target**: `string`

Defined in: [graph/src/layer/types.ts:1175](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1175)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1176](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1176)
