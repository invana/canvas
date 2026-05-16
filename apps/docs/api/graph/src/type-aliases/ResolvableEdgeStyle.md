# Type Alias: ResolvableEdgeStyle\<D\>

> **ResolvableEdgeStyle**\<`D`\> = `{ readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:739](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L739)

Resolver-aware mirror of [EdgeStyle](../interfaces/EdgeStyle.md); generic over the resolver argument.

## Type Parameters

### D

`D` = `unknown`
