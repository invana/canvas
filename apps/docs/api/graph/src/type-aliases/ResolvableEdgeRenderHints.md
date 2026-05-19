# Type Alias: ResolvableEdgeRenderHints

> **ResolvableEdgeRenderHints** = `{ [K in keyof EdgeRenderHints]?: Resolvable<NonNullable<EdgeRenderHints[K]>, GraphEdge> }`

Defined in: [graph/src/layer/types.ts:238](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L238)

Resolver-aware mirror of [EdgeRenderHints](../interfaces/EdgeRenderHints.md).
