# Function: generateTwitterActivity()

> **generateTwitterActivity**(`opts?`): `object`

Build the mocked Twitter activity graph (~100 nodes by default) by running the
per-type generators in `./generators` — one spec per node type and per edge
type, each property produced by its own `*_func`.

## Parameters

### opts?

`TwitterDatasetOptions` = `{}`

## Returns

`object`

### edges

> **edges**: `GraphEdge`\<`unknown`\>[]

### nodes

> **nodes**: `GeneratedNode`[]
