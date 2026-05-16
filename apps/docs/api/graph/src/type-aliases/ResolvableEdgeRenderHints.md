# Type Alias: ResolvableEdgeRenderHints

> **ResolvableEdgeRenderHints** = `{ [K in keyof EdgeRenderHints]?: Resolvable<NonNullable<EdgeRenderHints[K]>, GraphEdge> }`

Defined in: [graph/src/layer/types.ts:238](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/graph/src/layer/types.ts#L238)

Resolver-aware mirror of [EdgeRenderHints](../interfaces/EdgeRenderHints.md).
