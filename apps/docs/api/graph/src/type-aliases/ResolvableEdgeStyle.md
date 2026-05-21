# Type Alias: ResolvableEdgeStyle\<D\>

> **ResolvableEdgeStyle**\<`D`\> = `{ readonly [K in keyof EdgeStyle]?: Resolvable<NonNullable<EdgeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:1154](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1154)

Resolver-aware mirror of [EdgeStyle](../interfaces/EdgeStyle.md); generic over the resolver argument.

## Type Parameters

### D

`D` = `unknown`
