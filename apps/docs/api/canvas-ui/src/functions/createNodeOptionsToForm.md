# Function: createNodeOptionsToForm()

> **createNodeOptionsToForm**(`_o?`): [`CreateNodeFields`](../interfaces/CreateNodeFields.md)

Map a `CreateNodeBehaviourOptions`-shaped patch to the flat
[CreateNodeFields](../interfaces/CreateNodeFields.md). A no-op: `CreateNodeBehaviour` has no serialisable
scalar options (only callbacks + host-owned base fields).

## Parameters

### \_o?

[`CreateNodeOptions`](../interfaces/CreateNodeOptions.md) = `{}`

## Returns

[`CreateNodeFields`](../interfaces/CreateNodeFields.md)
