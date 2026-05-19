# Type Alias: Resolvable\<T, I\>

> **Resolvable**\<`T`, `I`\> = `T` \| ((`input`) => `T`)

Defined in: [graph/src/layer/types.ts:60](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L60)

A field value that's either a static value or a function that derives the
value from the host item (node / edge / raw data).

Used on every field of `NodeRenderHints` / `EdgeRenderHints` (legacy) and
`NodeStyle` / `EdgeStyle` (v3) so callers can supply per-item-derived
styling on `nodeDefaults` / `node` / `edge` defaults without spreading
hints into every node's / edge's `data`.

Resolved per render (layer-level) or once at insert (per-input). Keep
resolvers cheap and pure — they may run per frame. Recursive returns
(a function returning another function) are not unwrapped — return the
final value.

## Type Parameters

### T

`T`

### I

`I`

## Example

```ts
nodeDefaults: {
  fill: (n) => groupColors[n.data.group % groupColors.length],
  size: (n) => 12 + Math.sqrt(n.data.degree ?? 1) * 4,
  label: (n) => n.data.name,
}
```
