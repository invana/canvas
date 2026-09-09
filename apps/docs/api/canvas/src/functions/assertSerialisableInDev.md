# Function: assertSerialisableInDev()

> **assertSerialisableInDev**(`value`, `context`): `void`

Convenience: assert a payload is serialisable. In dev, logs warnings via
`console.warn` for each violation (with offending path). In production,
compiles to a no-op via `process.env.NODE_ENV` substitution.

Pass a `context` string so the warning includes which event triggered it,
e.g. `assertSerialisableInDev(payload, "emit('node:click')")`.

## Parameters

### value

`unknown`

### context

`string`

## Returns

`void`
