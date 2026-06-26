# Function: resolveField()

> **resolveField**\<`T`, `I`\>(`v`, `input`): `T`

Defined in: [graph/src/layer/types.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L78)

Unwrap a [Resolvable](../type-aliases/Resolvable.md) field for `input`. Static values pass through
untouched; function values are invoked once with `input` and their return
is used. Functions returning further functions are NOT unwrapped — return
the final value.

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
