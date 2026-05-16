# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:25](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/badges/placement.ts#L25)

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
