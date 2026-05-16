# Type Alias: ResolvableNodeRenderHints

> **ResolvableNodeRenderHints** = `{ [K in keyof NodeRenderHints]?: Resolvable<NonNullable<NodeRenderHints[K]>, GraphNode> }`

Defined in: [graph/src/layer/types.ts:192](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L192)

Resolver-aware mirror of [NodeRenderHints](../interfaces/NodeRenderHints.md) — every field accepts
either a static value (same as `NodeRenderHints`) or a function
`(node) => value` that derives the value per node from `node.data`.

Used by `nodeDefaults` (layer-wide fallback) and `NodeStateConfig`
(overlay applied while a named state is active). Keep resolvers cheap
and pure — they run per render call, not memoised.

## Example

```ts
nodeDefaults: {
  fill: (n) => groupColors[n.data.group % groupColors.length],
  size: (n) => 12 + Math.sqrt(n.data.degree ?? 1) * 4,
  label: (n) => n.data.name,
}
```
