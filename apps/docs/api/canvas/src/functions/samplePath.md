# Function: samplePath()

> **samplePath**(`path`): `Point`[]

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/connectors/pathSampling.ts#L27)

Densify a `Path` into a flat polyline. Lines emit two endpoints per
segment; quadratic / cubic curves are sampled with fixed substep counts.
Returns at least the move-to point when the path has only one command.

## Parameters

### path

[`Path`](../type-aliases/Path.md)

## Returns

`Point`[]
