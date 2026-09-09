# Function: samplePath()

> **samplePath**(`path`): [`Point`](../../../renderer-pixijs/src/interfaces/Point.md)[]

Densify a `Path` into a flat polyline. Lines emit two endpoints per
segment; quadratic / cubic curves are sampled with fixed substep counts.
Returns at least the move-to point when the path has only one command.

## Parameters

### path

[`Path`](../../../renderer-pixijs/src/type-aliases/Path.md)

## Returns

[`Point`](../../../renderer-pixijs/src/interfaces/Point.md)[]
