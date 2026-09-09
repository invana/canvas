# Type Alias: ResolvableNodeStyle\<D\>

> **ResolvableNodeStyle**\<`D`\> = `{ readonly [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, D> }`

Resolver-aware mirror of [NodeStyle](../interfaces/NodeStyle.md). Each field is either a static
value or `(D) => T`. Two scopes use this generic at different `D`:

  - `NodeOption.style` — resolvers fire at render (`D` = stored `GraphNode`).

## Type Parameters

### D

`D` = `unknown`
