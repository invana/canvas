# Function: isBuiltInNodeShape()

> **isBuiltInNodeShape**(`shape`): `shape is BuiltInNodeShapeOptions`

Defined in: [graph/src/layer/types.ts:347](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L347)

Type guard separating the typed built-in variants from
[CustomShapeOption](../interfaces/CustomShapeOption.md). Use this before reading variant-specific
fields so TypeScript narrows cleanly inside each `case`.

## Parameters

### shape

[`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

## Returns

`shape is BuiltInNodeShapeOptions`
