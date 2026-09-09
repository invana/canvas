# Function: isBuiltInNodeShape()

> **isBuiltInNodeShape**(`shape`): `shape is BuiltInNodeShapeOptions`

Type guard separating the typed built-in variants from
[CustomShapeOption](../interfaces/CustomShapeOption.md). Use this before reading variant-specific
fields so TypeScript narrows cleanly inside each `case`.

## Parameters

### shape

[`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

## Returns

`shape is BuiltInNodeShapeOptions`
