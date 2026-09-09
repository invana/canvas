# Function: tangentAt()

> **tangentAt**(`path`, `t`): [`Vec2`](../../../renderer-pixijs/src/interfaces/Vec2.md)

Compute the tangent unit vector at `t ∈ [0, 1]` along the path.
For v0 we only need `t = 0` (source) and `t = 1` (target) for marker
orientation; intermediate `t` is sampled via `samplePath` for now.

## Parameters

### path

[`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)

### t

`number`

## Returns

[`Vec2`](../../../renderer-pixijs/src/interfaces/Vec2.md)
