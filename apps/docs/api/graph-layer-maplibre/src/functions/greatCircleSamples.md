# Function: greatCircleSamples()

> **greatCircleSamples**(`from`, `to`, `n`): \[`number`, `number`\][]

Sample `n` points (`n >= 2`) along the great circle from `from` to `to`.

- `n = 2` returns just the endpoints.
- `n = 32` (the typical default for flight arcs) gives a visually-smooth
  curve at most map zooms; bump to 64+ for long transoceanic routes.

## Parameters

### from

[`LngLatTuple`](../type-aliases/LngLatTuple.md)

### to

[`LngLatTuple`](../type-aliases/LngLatTuple.md)

### n

`number`

## Returns

\[`number`, `number`\][]
