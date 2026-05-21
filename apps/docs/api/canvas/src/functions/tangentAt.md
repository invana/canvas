# Function: tangentAt()

> **tangentAt**(`path`, `t`): [`Vec2`](../interfaces/Vec2.md)

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:81](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/pathSampling.ts#L81)

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
