# Function: collapsedSpec()

> **collapsedSpec**(`spec`): `Record`\<`string`, `unknown`\>

The spec "as small as it goes" — what a collapsed container renders as.
Purely geometric: the kind decides what collapsing means to it. `undefined`
when the kind has no collapsed form, and callers then keep the spec as is.

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

## Returns

`Record`\<`string`, `unknown`\>
