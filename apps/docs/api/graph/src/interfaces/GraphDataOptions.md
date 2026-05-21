# Interface: GraphDataOptions\<DN, DE\>

Defined in: [graph/src/layer/types.ts:1256](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1256)

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

Defined in: [graph/src/layer/types.ts:1261](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1261)

#### Parameters

##### data

`DE`

#### Returns

`string`

***

### edges

> `readonly` **edges**: readonly [`EdgeInput`](EdgeInput.md)\<`DE`\>[]

Defined in: [graph/src/layer/types.ts:1258](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1258)

***

### nodeIdResolver?

> `readonly` `optional` **nodeIdResolver?**: (`data`) => `string`

Defined in: [graph/src/layer/types.ts:1260](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1260)

Optional layer-wide id resolver applied to nodes that lack an explicit `id`.

#### Parameters

##### data

`DN`

#### Returns

`string`

***

### nodes

> `readonly` **nodes**: readonly [`NodeInput`](NodeInput.md)\<`DN`\>[]

Defined in: [graph/src/layer/types.ts:1257](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1257)
