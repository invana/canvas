# Function: lassoSelectOptionsToForm()

> **lassoSelectOptionsToForm**(`o?`): [`LassoSelectFields`](../interfaces/LassoSelectFields.md)

Map a `LassoSelectBehaviourOptions`-shaped patch to the flat
[LassoSelectFields](../interfaces/LassoSelectFields.md) the `@invana/forms` generator renders. The
`enableElements` array becomes two booleans; the `trigger` array collapses to
a single select; the nested `style` group is flattened; colours are
normalised to hex strings.

## Parameters

### o?

[`LassoSelectOptions`](../interfaces/LassoSelectOptions.md) = `{}`

## Returns

[`LassoSelectFields`](../interfaces/LassoSelectFields.md)
