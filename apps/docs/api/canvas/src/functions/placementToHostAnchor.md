# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [packages/canvas/src/primitives/badges/placement.ts:25](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/badges/placement.ts#L25)

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
