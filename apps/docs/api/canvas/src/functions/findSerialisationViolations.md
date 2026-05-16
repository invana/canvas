# Function: findSerialisationViolations()

> **findSerialisationViolations**(`value`, `rootPath?`): `string`[]

Defined in: [canvas/src/events/assertSerialisable.ts:34](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/events/assertSerialisable.ts#L34)

Walk `value`, returning a list of human-readable violation messages.
Empty array means "fully serialisable".

The walker is iterative-ish: it uses recursion but with explicit cycle
detection so a self-referencing payload doesn't blow the stack.

## Parameters

### value

`unknown`

### rootPath?

`string` = `''`

## Returns

`string`[]
