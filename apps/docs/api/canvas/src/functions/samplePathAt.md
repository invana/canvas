# Function: samplePathAt()

> **samplePathAt**(`path`, `t`): `object`

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:109](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/connectors/pathSampling.ts#L109)

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
