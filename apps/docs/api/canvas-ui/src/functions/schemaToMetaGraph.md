# Function: schemaToMetaGraph()

> **schemaToMetaGraph**(`schema`, `__namedParameters?`): `SchemaMetaGraph`

Compile a [GraphSchema](../interfaces/GraphSchema.md) into the `GraphData` the `SchemaViewPanel`'s canvas
renders: one node per node-type (a simple disc or a composite ER table, per
`nodeMode`) and one edge per connection pair (routed per `edgeRouting`, labelled
by edge type). Connections whose endpoints aren't present as node-types are
dropped. Node positions are seeded on a ring so a force layout never starts
fully coincident (a deterministic layout overwrites them).

## Parameters

### schema

[`GraphSchema`](../interfaces/GraphSchema.md)

### \_\_namedParameters?

[`SchemaMetaGraphOptions`](../interfaces/SchemaMetaGraphOptions.md) = `{}`

## Returns

`SchemaMetaGraph`
