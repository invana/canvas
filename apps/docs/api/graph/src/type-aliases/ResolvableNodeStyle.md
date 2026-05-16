# Type Alias: ResolvableNodeStyle\<D\>

> **ResolvableNodeStyle**\<`D`\> = `{ readonly [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, D> }`

Defined in: [graph/src/layer/types.ts:571](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L571)

Resolver-aware mirror of [NodeStyle](../interfaces/NodeStyle.md). Each field is either a static
value or `(D) => T`. Two scopes use this generic at different `D`:

  - `NodeInput<D>.style` — resolvers fire at insert (`D` = raw node data).
  - `NodeOption.style` — resolvers fire at render (`D` = stored `GraphNode`).

## Type Parameters

### D

`D` = `unknown`
