# Function: placementToHostAnchor()

> **placementToHostAnchor**(`hostBounds`, `placement`): `object`

Defined in: [canvas/src/primitives/badges/placement.ts:26](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/badges/placement.ts#L26)

Returns the world-space anchor point for `placement`. Named placements
resolve against `hostBounds` (corner or edge midpoint of the AABB); the
raw `{ x, y }` variant is the world-space point itself, with `hostBounds`
ignored.

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
