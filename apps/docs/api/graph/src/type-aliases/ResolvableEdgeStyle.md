# Type Alias: ResolvableEdgeStyle\<D\>

> **ResolvableEdgeStyle**\<`D`\> = `{ readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D> }`

Resolver-aware mirror of [EdgeStyle](../interfaces/EdgeStyle.md); generic over the resolver argument.

## Type Parameters

### D

`D` = `unknown`
