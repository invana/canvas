# Function: clickSelectOptionsToForm()

> **clickSelectOptionsToForm**(`o?`): [`ClickSelectFields`](../interfaces/ClickSelectFields.md)

Map a `ClickSelectBehaviourOptions`-shaped patch to the flat
[ClickSelectFields](../interfaces/ClickSelectFields.md) the `@invana/forms` generator renders. The engine's
`trigger: SelectModifierKey[]` array collapses to a single select — the first
modifier, or `'none'` for an empty gate.

## Parameters

### o?

[`ClickSelectOptions`](../interfaces/ClickSelectOptions.md) = `{}`

## Returns

[`ClickSelectFields`](../interfaces/ClickSelectFields.md)
