# Function: brushSelectOptionsToForm()

> **brushSelectOptionsToForm**(`o?`): [`BrushSelectFields`](../interfaces/BrushSelectFields.md)

Map a `BrushSelectBehaviourOptions`-shaped patch to the flat
[BrushSelectFields](../interfaces/BrushSelectFields.md) the `@invana/forms` generator renders. The
`enableElements` array becomes two booleans; the `trigger` array collapses to
a single select; the nested `style` group is flattened; colours are
normalised to hex strings.

## Parameters

### o?

[`BrushSelectOptions`](../interfaces/BrushSelectOptions.md) = `{}`

## Returns

[`BrushSelectFields`](../interfaces/BrushSelectFields.md)
