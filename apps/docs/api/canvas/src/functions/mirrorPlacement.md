# Function: mirrorPlacement()

> **mirrorPlacement**(`p`): [`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md)

Defined in: [canvas/src/primitives/badges/placement.ts:91](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/badges/placement.ts#L91)

Mirror of a named placement across the host centre. `top-right` ↔
`bottom-left`, `right` ↔ `left`, and so on. Used as the default `origin`
so a badge with `placement: 'top-right'` sits with its `bottom-left`
corner at the host's top-right corner — i.e. the badge nests fully
outside the host edge. Only defined for [NamedBadgePlacement](../type-aliases/NamedBadgePlacement.md);
raw `{x, y}` placements have no symmetric counterpart on the host AABB.

## Parameters

### p

[`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md)

## Returns

[`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md)
