# Type Alias: ResolvableEdgeStyle\<D\>

> **ResolvableEdgeStyle**\<`D`\> = `{ readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:739](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L739)

Resolver-aware mirror of [EdgeStyle](../interfaces/EdgeStyle.md); generic over the resolver argument.

## Type Parameters

### D

`D` = `unknown`
