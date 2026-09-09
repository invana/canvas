# Function: connectorHitBoxes()

> **connectorHitBoxes**(`poly`, `strokeWidth`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)[]

World-space hit **boxes** for a connector — the segment-level hit index
(edge-pick correctness H). A single loose AABB over a long diagonal edge
makes that edge a candidate for every point in a huge empty box; splitting
the sampled polyline into up to CONNECTOR\_HIT\_MAX\_BOXES tight boxes
(cut at equal arc-length, so straight diagonals subdivide and curves — which
sampling already densifies — get one box per run) keeps the candidate set to
edges *physically near* the cursor, making "nearest" cheaper and more
meaningful in a bundle. Short edges collapse to one loose box, so nothing
regresses.

## Parameters

### poly

[`HitPolyline`](../type-aliases/HitPolyline.md)

### strokeWidth

`number`

## Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)[]
