# Interface: EdgeInput\<D\>

Defined in: [graph/src/layer/types.ts:1225](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1225)

Resolver-aware input shape for an edge.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1230](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1230)

***

### id?

> `readonly` `optional` **id?**: [`ResolvableId`](../type-aliases/ResolvableId.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1226](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1226)

***

### source

> `readonly` **source**: `string`

Defined in: [graph/src/layer/types.ts:1227](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1227)

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<`D`\>\>\>

Defined in: [graph/src/layer/types.ts:1232](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1232)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1233](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1233)

***

### style?

> `readonly` `optional` **style?**: [`ResolvableEdgeStyle`](../type-aliases/ResolvableEdgeStyle.md)\<`D`\>

Defined in: [graph/src/layer/types.ts:1231](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1231)

***

### target

> `readonly` **target**: `string`

Defined in: [graph/src/layer/types.ts:1228](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1228)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1229](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1229)
