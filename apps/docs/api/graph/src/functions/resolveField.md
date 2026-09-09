# Function: resolveField()

> **resolveField**\<`T`, `I`\>(`v`, `input`): `T`

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
