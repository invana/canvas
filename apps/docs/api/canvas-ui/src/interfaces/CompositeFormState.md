# Interface: CompositeFormState

react-hook-form state shape. Body/root scalars nest under `composite` (an
`ObjectField`); `parts` is the top-level `useFieldArray`. `compositeToForm` /
`formToComposite` round-trip between this and a `CompositeShapeOption`.

## Properties

### composite

> **composite**: [`CompositeScalarFields`](CompositeScalarFields.md)

***

### parts

> **parts**: [`CompositePartRow`](CompositePartRow.md)[]
