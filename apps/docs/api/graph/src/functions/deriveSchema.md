# Function: deriveSchema()

> **deriveSchema**(`store`, `__namedParameters?`): [`GraphSchema`](../interfaces/GraphSchema.md)

Derive the [GraphSchema](../interfaces/GraphSchema.md) of a graph by scanning a [GraphStore](../classes/GraphStore.md)'s
loaded nodes/edges once. Pure and synchronous; returns an empty schema for a
missing store. This is the **observed** schema (what's loaded) — for the
authoritative one prefer `store.schema` and fall back to this.

## Parameters

### store

[`GraphStore`](../classes/GraphStore.md)

### \_\_namedParameters?

[`DeriveSchemaOptions`](../interfaces/DeriveSchemaOptions.md) = `{}`

## Returns

[`GraphSchema`](../interfaces/GraphSchema.md)
