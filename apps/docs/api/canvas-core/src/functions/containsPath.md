# Function: containsPath()

> **containsPath**(`spec`, `localX`, `localY`, `pad?`): `boolean`

An open path is tested against its **run**, not a phantom closed area: only a
`closed` (or `smooth`, which implies closed) path has an interior, matching
the paint path, which fills only when closed. So an unfilled contour line
answers `true` along its stroke and nowhere else.

`smooth` paths are approximated by the control polygon rather than the
quadratic spline it generates. The spline passes through the segment
midpoints and bulges toward each control point, so the two differ by at most
half a segment's sagitta — a fraction of a pixel at contour densities.

## Parameters

### spec

[`LocalSpec`](../type-aliases/LocalSpec.md)\<[`PathSpec`](../interfaces/PathSpec.md)\>

### localX

`number`

### localY

`number`

### pad?

`number` = `0`

## Returns

`boolean`
