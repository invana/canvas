# Function: schemaSignature()

> **schemaSignature**(`schema`): `string`

A compact string that changes only when the schema's **structure** changes
(type names, counts, property counts, connectivity) — handy for keying/memoing
off a schema.

## Parameters

### schema

[`GraphSchema`](../interfaces/GraphSchema.md)

## Returns

`string`
