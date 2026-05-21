# Function: findSerialisationViolations()

> **findSerialisationViolations**(`value`, `rootPath?`): `string`[]

Defined in: [canvas/src/events/assertSerialisable.ts:34](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/events/assertSerialisable.ts#L34)

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
