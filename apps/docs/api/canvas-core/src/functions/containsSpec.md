# Function: containsSpec()

> **containsSpec**(`spec`, `localX`, `localY`, `strokeTolerance?`): `boolean`

Does `(localX, localY)` fall inside the region this spec paints?

`strokeTolerance` overrides the widening the spec's own stroke would imply
(both inward and outward). Omit it and the band is derived from
`spec.stroke` — width and alignment — which is what the renderer wants: the
hit region then tracks whatever the shape actually draws.

Returns `undefined` for a kind this module doesn't know. That is not a
failure: `registerShape` admits third-party kinds, and the caller falls back
to asking the instance (`IShape.getHitArea`). Distinguishing "not contained"
from "cannot answer" is the whole point of the `boolean | undefined` return.

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

### localX

`number`

### localY

`number`

### strokeTolerance?

`number`

## Returns

`boolean`
