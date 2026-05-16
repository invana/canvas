# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:25](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/badges/placement.ts#L25)

Returns the world-space point on `hostBounds` named by `placement`.
Edge placements sit at the midpoint of that edge; corner placements at the
corner.

## Parameters

### hostBounds

[`Rect`](../interfaces/Rect.md)

### placement

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
