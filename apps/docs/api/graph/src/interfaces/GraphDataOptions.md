# Interface: GraphDataOptions\<DN, DE\>

Defined in: [graph/src/layer/types.ts:1309](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1309)

Top-level data input shape for `GraphLayer.setData(opts)`. Carries node /
edge inputs plus optional layer-wide id resolvers.

## Type Parameters

### DN

`DN` = `unknown`

### DE

`DE` = `unknown`

## Properties

### edgeIdResolver?

> `readonly` `optional` **edgeIdResolver?**: (`data`) => `string`

Defined in: [graph/src/layer/types.ts:1314](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1314)

#### Parameters

##### data

`DE`

#### Returns

`string`

***

### edges

> `readonly` **edges**: readonly [`EdgeInput`](EdgeInput.md)\<`DE`\>[]

Defined in: [graph/src/layer/types.ts:1311](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1311)

***

### nodeIdResolver?

> `readonly` `optional` **nodeIdResolver?**: (`data`) => `string`

Defined in: [graph/src/layer/types.ts:1313](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1313)

Optional layer-wide id resolver applied to nodes that lack an explicit `id`.

#### Parameters

##### data

`DN`

#### Returns

`string`

***

### nodes

> `readonly` **nodes**: readonly [`NodeInput`](NodeInput.md)\<`DN`\>[]

Defined in: [graph/src/layer/types.ts:1310](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1310)
