# Interface: CardSpecFields

The editor's react-hook-form state — scalars under `card` (rendered by an
`ObjectField`) and `rows` as a `useFieldArray`. `specToForm` / `formToSpec`
bridge this and the serializable `HoverElementPreviewCardSpec`.

## Properties

### card

> **card**: [`CardScalarFields`](CardScalarFields.md)

***

### rows

> **rows**: [`CardRowField`](CardRowField.md)[]
