# Function: collapseExpandOptionsToForm()

> **collapseExpandOptionsToForm**(`o?`): [`CollapseExpandFields`](../interfaces/CollapseExpandFields.md)

Map a `CollapseExpandBehaviourOptions`-shaped patch to the flat
[CollapseExpandFields](../interfaces/CollapseExpandFields.md). Both options are plain booleans, so this is a
straight copy — each falls back to the engine's `true` default so an unset
option still renders its checkbox in the effective state.

## Parameters

### o?

[`CollapseExpandOptions`](../interfaces/CollapseExpandOptions.md) = `{}`

## Returns

[`CollapseExpandFields`](../interfaces/CollapseExpandFields.md)
