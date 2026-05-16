# Interface: GraphDataOptions\<DN, DE\>

Defined in: [graph/src/layer/types.ts:782](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L782)

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

Defined in: [graph/src/layer/types.ts:787](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L787)

#### Parameters

##### data

`DE`

#### Returns

`string`

***

### edges

> `readonly` **edges**: readonly [`EdgeInput`](EdgeInput.md)\<`DE`\>[]

Defined in: [graph/src/layer/types.ts:784](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L784)

***

### nodeIdResolver?

> `readonly` `optional` **nodeIdResolver?**: (`data`) => `string`

Defined in: [graph/src/layer/types.ts:786](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L786)

Optional layer-wide id resolver applied to nodes that lack an explicit `id`.

#### Parameters

##### data

`DN`

#### Returns

`string`

***

### nodes

> `readonly` **nodes**: readonly [`NodeInput`](NodeInput.md)\<`DN`\>[]

Defined in: [graph/src/layer/types.ts:783](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L783)
