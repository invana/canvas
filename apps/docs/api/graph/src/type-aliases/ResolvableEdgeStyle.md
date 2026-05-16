# Type Alias: ResolvableEdgeStyle\<D\>

> **ResolvableEdgeStyle**\<`D`\> = `{ readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:739](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L739)

Resolver-aware mirror of [EdgeStyle](../interfaces/EdgeStyle.md); generic over the resolver argument.

## Type Parameters

### D

`D` = `unknown`
