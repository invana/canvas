# Function: compileFreeform()

> **compileFreeform**(`struct`, `node`, `palette`): `Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>

Compile a [FreeformStructure](../interfaces/FreeformStructure.md) into a `composite` shape. Element
coordinates are already absolute (the designer canvas is 1:1 with the card),
so this is a direct map: bind text to data, resolve every colour role against
the palette, and emit one [CompositePart](../../../canvas/src/variables/SpecStore.md) per element. Self-contained —
no styling/binding template needed.

## Parameters

### struct

[`FreeformStructure`](../interfaces/FreeformStructure.md)

### node

[`GraphNode`](../interfaces/GraphNode.md)

### palette

`RolePalette`

## Returns

`Partial`\<[`NodeStyle`](../interfaces/NodeStyle.md)\>
