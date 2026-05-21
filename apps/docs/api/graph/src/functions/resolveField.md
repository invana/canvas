# Function: resolveField()

> **resolveField**\<`T`, `I`\>(`v`, `input`): `T`

Defined in: [graph/src/layer/types.ts:70](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L70)

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
