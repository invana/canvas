# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/badges/placement.ts#L26)

Returns the world-space anchor point for `placement`. Named placements
resolve against `hostBounds` (corner or edge midpoint of the AABB); the
raw `{ x, y }` variant is the world-space point itself, with `hostBounds`
ignored.

## Parameters

### hostBounds

`Rect`

### placement

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
