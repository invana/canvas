# Function: tangentAt()

> **tangentAt**(`path`, `t`): [`Vec2`](../interfaces/Vec2.md)

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:81](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/connectors/pathSampling.ts#L81)

Compute the tangent unit vector at `t ∈ [0, 1]` along the path.
For v0 we only need `t = 0` (source) and `t = 1` (target) for marker
orientation; intermediate `t` is sampled via `samplePath` for now.

## Parameters

### path

[`Path`](../type-aliases/Path.md)

### t

`number`

## Returns

[`Vec2`](../interfaces/Vec2.md)
