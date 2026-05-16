# Type Alias: ResolvableEdgeRenderHints

> **ResolvableEdgeRenderHints** = `{ [K in keyof EdgeRenderHints]?: Resolvable<NonNullable<EdgeRenderHints[K]>, GraphEdge> }`

Defined in: [graph/src/layer/types.ts:238](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L238)

Resolver-aware mirror of [EdgeRenderHints](../interfaces/EdgeRenderHints.md).
