# Function: resolveField()

> **resolveField**\<`T`, `I`\>(`v`, `input`): `T`

Defined in: [graph/src/layer/types.ts:75](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph/src/layer/types.ts#L75)

Unwrap a [Resolvable](../type-aliases/Resolvable.md) field for `input`. Static values pass through
untouched; function values are invoked once with `input` and their return
is used. Functions returning further functions are NOT unwrapped — return
the final value.

Exposed so callers reading defaults via `graphLayer.getNodeDefaults()` /
`getEdgeDefaults()` can resolve resolver-typed fields without re-implementing
the function check.

## Type Parameters

### T

`T`

### I

`I`

## Parameters

### v

[`Resolvable`](../type-aliases/Resolvable.md)\<`T`, `I`\>

### input

`I`

## Returns

`T`
