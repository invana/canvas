# Function: mirrorPlacement()

> **mirrorPlacement**(`p`): [`BadgePlacement`](../type-aliases/BadgePlacement.md)

Defined in: [packages/canvas/src/primitives/badges/placement.ts:70](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/badges/placement.ts#L70)

Mirror of a placement across the host centre. `top-right` ↔ `bottom-left`,
`right` ↔ `left`, and so on. Used as the default `origin` so a badge with
`placement: 'top-right'` sits with its `bottom-left` corner at the host's
top-right corner — i.e. the badge nests fully outside the host edge.

## Parameters

### p

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

## Returns

[`BadgePlacement`](../type-aliases/BadgePlacement.md)
