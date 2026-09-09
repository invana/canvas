# Function: formToComposite()

> **formToComposite**(`state`): `CompositeShapeOption`

Inverse of [compositeToForm](compositeToForm.md): the form state → a `CompositeShapeOption`.
`width`/`height` default (160×96) so the result is always a valid card;
optional body fields are included only when set. Safe to hand to
`store.updateNode(id, { style: { shape: formToComposite(values) } })`.

## Parameters

### state

[`CompositeFormState`](../interfaces/CompositeFormState.md)

## Returns

`CompositeShapeOption`
