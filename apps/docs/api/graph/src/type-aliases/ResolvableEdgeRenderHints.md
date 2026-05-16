# Type Alias: ResolvableEdgeRenderHints

> **ResolvableEdgeRenderHints** = `{ [K in keyof EdgeRenderHints]?: Resolvable<NonNullable<EdgeRenderHints[K]>, GraphEdge> }`

Defined in: [graph/src/layer/types.ts:238](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L238)

Resolver-aware mirror of [EdgeRenderHints](../interfaces/EdgeRenderHints.md).
