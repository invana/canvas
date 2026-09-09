# Function: jsonSafe()

> **jsonSafe**\<`T`\>(`value`): `T`

JSON-safe deep copy: drops functions, `undefined`, and other non-serialisable
values (via `JSON.stringify`, which omits them). Returns `undefined` when the
whole value serialises away. Used by `serializeDefinition()` implementers so a
template carrying resolver functions still yields a clean, portable slice.

## Type Parameters

### T

`T`

## Parameters

### value

`T`

## Returns

`T`
