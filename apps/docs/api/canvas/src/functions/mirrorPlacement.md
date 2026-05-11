# Function: mirrorPlacement()

> **mirrorPlacement**(`p`): [`BadgePlacement`](../type-aliases/BadgePlacement.md)

Defined in: [packages/canvas/src/primitives/badges/placement.ts:70](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/badges/placement.ts#L70)

Mirror of a placement across the host centre. `top-right` ↔ `bottom-left`,
`right` ↔ `left`, and so on. Used as the default `origin` so a badge with
`placement: 'top-right'` sits with its `bottom-left` corner at the host's
top-right corner — i.e. the badge nests fully outside the host edge.

## Parameters

### p

[`BadgePlacement`](../type-aliases/BadgePlacement.md)

## Returns

[`BadgePlacement`](../type-aliases/BadgePlacement.md)
