# Function: boundsOfArc()

> **boundsOfArc**(`spec`): [`Rect`](../interfaces/Rect.md)

Axis-aligned bounding box for an annular sector. The extreme points are
either on the four sector corners (a0/inner, a0/outer, a1/inner, a1/outer)
or at the cardinal angles (0, π/2, π, 3π/2) on the outer radius if those
angles fall inside the sweep — those produce the (±outerR, 0) / (0, ±outerR)
extents.

## Parameters

### spec

[`LocalSpec`](../type-aliases/LocalSpec.md)\<[`ArcSpec`](../interfaces/ArcSpec.md)\>

## Returns

[`Rect`](../interfaces/Rect.md)
