# Type Alias: Resolvable\<T, I\>

> **Resolvable**\<`T`, `I`\> = `T` \| ((`input`) => `T`)

Defined in: [graph/src/layer/types.ts:59](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L59)

A field value that's either a static value or a function that derives the
value from the host item (node / edge / raw data).

Used on every field of `NodeStyle` / `EdgeStyle` (via `ResolvableNodeStyle`
/ `ResolvableEdgeStyle`) so callers can supply per-item-derived styling
on the layer template (`options.node.style`) or per-instance input
(`NodeInput.style`) without spreading hints into every node's `data`.

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
node: {
  style: {
    bgFill:    (n) => groupColors[(n.data as Group).group % groupColors.length],
    shape:     (n) => ({ kind: 'circle', radius: 12 + Math.sqrt((n.data as N).degree ?? 1) * 4 }),
    labelText: (n) => (n.data as N).name,
  },
}
```
