# Interface: GraphSchema

The schema of a graph — its metagraph. Either **observed** (derived from loaded
data via [deriveSchema](../functions/deriveSchema.md)) or **authoritative** (declared by a data source
and stored on the graph via `GraphStore.setSchema`).

## Properties

### edgeTypes

> **edgeTypes**: [`SchemaEdgeType`](SchemaEdgeType.md)[]

Edge types, sorted by descending count then name.

***

### nodeTypes

> **nodeTypes**: [`SchemaNodeType`](SchemaNodeType.md)[]

Node types, sorted by descending count then name.
