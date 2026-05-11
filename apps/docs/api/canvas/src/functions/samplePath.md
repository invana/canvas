# Function: samplePath()

> **samplePath**(`path`): [`Point`](../interfaces/Point.md)[]

Defined in: [packages/canvas/src/primitives/connectors/pathSampling.ts:27](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/connectors/pathSampling.ts#L27)

Densify a `Path` into a flat polyline. Lines emit two endpoints per
segment; quadratic / cubic curves are sampled with fixed substep counts.
Returns at least the move-to point when the path has only one command.

## Parameters

### path

[`Path`](../type-aliases/Path.md)

## Returns

[`Point`](../interfaces/Point.md)[]
