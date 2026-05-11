# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [packages/canvas/src/primitives/badges/placement.ts:25](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/badges/placement.ts#L25)

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
