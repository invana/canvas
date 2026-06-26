# Interface: CardSpecFields

Defined in: [canvas-ui/src/editors/hover-preview-card/types.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/hover-preview-card/types.ts#L30)

The editor's react-hook-form state — scalars under `card` (rendered by an
`ObjectField`) and `rows` as a `useFieldArray`. `specToForm` / `formToSpec`
bridge this and the serializable `HoverElementPreviewCardSpec`.

## Properties

### card

> **card**: [`CardScalarFields`](CardScalarFields.md)

Defined in: [canvas-ui/src/editors/hover-preview-card/types.ts:31](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/hover-preview-card/types.ts#L31)

***

### rows

> **rows**: [`CardRowField`](CardRowField.md)[]

Defined in: [canvas-ui/src/editors/hover-preview-card/types.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/editors/hover-preview-card/types.ts#L32)
