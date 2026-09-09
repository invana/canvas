# Function: computeChange()

> **computeChange**\<`T`\>(`state`, `update`): `object`

Apply an [Update](../../../canvas/src/type-aliases/Update.md) (recipe or deep-partial patch) to `state` via immer,
returning the next state plus the forward/inverse patch pair. Pure — does not
mutate `state`.

## Type Parameters

### T

`T`

## Parameters

### state

`T`

### update

[`Update`](../../../canvas/src/type-aliases/Update.md)\<`T`\>

## Returns

`object`

### inverse

> **inverse**: `Patch`[]

### next

> **next**: `T`

### patches

> **patches**: `Patch`[]
