# Function: assertSerialisableInDev()

> **assertSerialisableInDev**(`value`, `context`): `void`

Defined in: [canvas/src/events/assertSerialisable.ts:137](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/events/assertSerialisable.ts#L137)

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
