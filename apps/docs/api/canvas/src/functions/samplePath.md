# Function: samplePath()

> **samplePath**(`path`): [`Point`](../interfaces/Point.md)[]

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:27](https://github.com/invana/canvas/blob/9082d7c9f5a0b14b8c8220f666d8bd3c74c1d3bd/packages/canvas/src/primitives/connectors/pathSampling.ts#L27)

Densify a `Path` into a flat polyline. Lines emit two endpoints per
segment; quadratic / cubic curves are sampled with fixed substep counts.
Returns at least the move-to point when the path has only one command.

## Parameters

### path

[`Path`](../type-aliases/Path.md)

## Returns

[`Point`](../interfaces/Point.md)[]
