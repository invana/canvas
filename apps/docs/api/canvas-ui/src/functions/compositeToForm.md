# Function: compositeToForm()

> **compositeToForm**(`option?`): [`CompositeFormState`](../interfaces/CompositeFormState.md)

Map a `CompositeShapeOption` to the flat [CompositeFormState](../interfaces/CompositeFormState.md) the
generator renders — body scalars, the `root` union flattened to
`rootKind` + geometry, and each part to a flat row. Colours become hex; a
missing option seeds an empty card.

## Parameters

### option?

`CompositeShapeOption`

## Returns

[`CompositeFormState`](../interfaces/CompositeFormState.md)
