# Function: tangentAt()

> **tangentAt**(`path`, `t`): [`Vec2`](../interfaces/Vec2.md)

Defined in: [packages/canvas/src/primitives/connectors/pathSampling.ts:81](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/connectors/pathSampling.ts#L81)

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
