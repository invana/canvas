# Function: useDerivedSchema()

> **useDerivedSchema**(`canvas`, `__namedParameters?`): [`GraphSchema`](../interfaces/GraphSchema.md)

The reactive schema of `canvas`'s `layerId` layer — the authoritative schema if
one was set on the store, else the schema derived from the loaded data.
Recomputes (coalesced per frame) on topology/data/`schema` changes; empty while
the canvas/layer is null.

`nodeTypeOf` / `edgeTypeOf` feed the effect's dependency list — pass **stable**
(memoized or module-level) functions, or the subscription re-establishes each
render.

## Parameters

### canvas

`GraphCanvas`

### \_\_namedParameters?

[`UseDerivedSchemaOptions`](../interfaces/UseDerivedSchemaOptions.md) = `{}`

## Returns

[`GraphSchema`](../interfaces/GraphSchema.md)
