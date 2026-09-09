# Interface: SchemaNodeType

A distinct node type (label) and what's known about its instances.

## Properties

### count

> **count**: `number`

How many nodes of this type are known (0 for an authoritative type not yet loaded).

***

### name

> **name**: `string`

The type name.

***

### properties

> **properties**: [`SchemaProperty`](SchemaProperty.md)[]

Properties (key + value type), sorted by name.
