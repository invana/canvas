# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:25](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/badges/placement.ts#L25)

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
