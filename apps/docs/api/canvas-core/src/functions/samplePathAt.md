# Function: samplePathAt()

> **samplePathAt**(`path`, `t`): `object`

Combined point + unit-tangent sample at parameter `t ∈ [0, 1]` along the
path. Used by labels-along-path and any other decoration that needs both
the location and the local direction at the same parameter (e.g. for
`autoRotate`). Cheaper than calling `samplePath` + `tangentAt` separately
because it walks the polyline once.

`t` is fractional in arc-length space — the function picks the segment of
the densified polyline whose cumulative length most closely matches `t *
totalLength` and linearly interpolates inside it. For most practical path
kinds this matches an analytical sample to within a pixel; orthogonal
paths reproduce segment endpoints exactly.

## Parameters

### path

[`Path`](../type-aliases/Path.md)

### t

`number`

## Returns

`object`

### point

> **point**: [`Point`](../interfaces/Point.md)

### tangent

> **tangent**: [`Vec2`](../interfaces/Vec2.md)
