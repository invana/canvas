# Function: compositeRootOffset()

> **compositeRootOffset**(`spec`): [`Point`](../interfaces/Point.md)

Translation from the composite's top-left origin to the borrowed root's own
local origin — the offset that centres the root in the `width × height` box.

Origin-agnostic by construction: it works off the root's *bounding-box*
centre, so a rect (top-left origin) and a circle (centred origin) both land
in the middle of the card. The renderer applies exactly this before tracing
the root, which is why hit-testing has to apply it too.

## Parameters

### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

## Returns

[`Point`](../interfaces/Point.md)
