# Type Alias: ResolvableNodeStyle\<D\>

> **ResolvableNodeStyle**\<`D`\> = `{ readonly [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:960](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L960)

Resolver-aware mirror of [NodeStyle](../interfaces/NodeStyle.md). Each field is either a static
value or `(D) => T`. Two scopes use this generic at different `D`:

  - `NodeInput<D>.style` — resolvers fire at insert (`D` = raw node data).
  - `NodeOption.style` — resolvers fire at render (`D` = stored `GraphNode`).

## Type Parameters

### D

`D` = `unknown`
