# Function: applyDeepPartial()

> **applyDeepPartial**(`draft`, `patch`): `void`

Deep-merge `patch` into a mutable `draft` in place: plain objects merge
field-by-field; everything else (arrays, sets, maps, functions, primitives,
class instances) **replaces**. Mirrors the engine's `deepMerge` semantics.

Prototype-polluting keys (FORBIDDEN\_MERGE\_KEYS) are skipped — this is
the store's public write path (`update(patch)`) and receives untrusted input.

## Parameters

### draft

`Record`\<`string`, `unknown`\>

### patch

`Record`\<`string`, `unknown`\>

## Returns

`void`
