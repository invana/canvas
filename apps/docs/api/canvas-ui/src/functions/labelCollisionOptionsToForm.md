# Function: labelCollisionOptionsToForm()

> **labelCollisionOptionsToForm**(`o?`): [`LabelCollisionFields`](../interfaces/LabelCollisionFields.md)

Map a `LabelCollisionBehaviourOptions`-shaped patch to the flat
[LabelCollisionFields](../interfaces/LabelCollisionFields.md) the `@invana/forms` generator renders. The
nested `groups: { nodes, edges }` object is flattened to `groupNodes` /
`groupEdges`; everything else passes through.

## Parameters

### o?

[`LabelCollisionOptions`](../interfaces/LabelCollisionOptions.md) = `{}`

## Returns

[`LabelCollisionFields`](../interfaces/LabelCollisionFields.md)
