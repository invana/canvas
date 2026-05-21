# Function: isBuiltInNodeShape()

> **isBuiltInNodeShape**(`shape`): `shape is BuiltInNodeShapeOptions`

Defined in: [graph/src/layer/types.ts:317](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L317)

Type guard separating the typed built-in variants from
[CustomShapeOption](../interfaces/CustomShapeOption.md). Use this before reading variant-specific
fields so TypeScript narrows cleanly inside each `case`.

## Parameters

### shape

[`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

## Returns

`shape is BuiltInNodeShapeOptions`
