# Function: polygonContainsInflated()

> **polygonContainsInflated**(`x`, `y`, `vertices`, `pad?`, `closed?`): `boolean`

Containment against a vertex ring **grown (or shrunk) by `pad`**.

- `pad > 0` — inside the ring *or* within `pad` of its outline. This is the
  region a centred stroke of half-width `pad` covers, and it is exactly the
  union pixi's `Graphics.containsPoint` reports for a filled + stroked
  polygon (`Polygon.contains` ∪ `Polygon.strokeContains`).
- `pad < 0` — inside the ring *and* further than `|pad|` from its outline:
  the silhouette eroded inward, used to punch the hole out of a
  fill-less shape so only its stroke band answers `true`.

The offset is a true distance offset (round joins at convex corners), not a
miter offset, so a spike's tip grows by `pad` rather than by `pad / sin(θ/2)`
— the same approximation pixi makes.

## Parameters

### x

`number`

### y

`number`

### vertices

readonly [`Point`](../interfaces/Point.md)[]

### pad?

`number` = `0`

### closed?

`boolean` = `true`

## Returns

`boolean`
