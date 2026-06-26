# Function: compileSimple()

> **compileSimple**(`struct`, `styling`, `bindings`, `node`, `palette`): `Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

Defined in: graph/src/template/compile.ts:44

Compile a simple structure into label + shape + fill/stroke style fields.

## Parameters

### struct

[`SimpleStructure`](../interfaces/SimpleStructure.md)

### styling

[`NodeStylingTemplate`](../interfaces/NodeStylingTemplate.md)

### bindings

`Record`\<`string`, `string`\>

### node

[`GraphNode`](../interfaces/GraphNode.md)

### palette

`RolePalette`

## Returns

`Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>
