# Function: distanceToOutlineSq()

> **distanceToOutlineSq**(`x`, `y`, `vertices`, `closed?`): `number`

Squared distance from `(x, y)` to the nearest **edge** of a vertex ring.
`closed` includes the wrap-around edge (last → first); an open run omits it,
which is what a `path` spec with `closed: false` draws.

## Parameters

### x

`number`

### y

`number`

### vertices

readonly [`Point`](../interfaces/Point.md)[]

### closed?

`boolean` = `true`

## Returns

`number`
