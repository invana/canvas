# Interface: HoverElementPreviewCardSpec

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:126](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L126)

The serializable preview-card template. Pure JSON — author it in display
settings and feed it verbatim. `id` + `type` are rendered automatically
(structural, from the resolved target) and need no field entry here.

## Properties

### image?

> `optional` **image?**: [`PreviewImageSpec`](PreviewImageSpec.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L128)

Left avatar; the whole block is skipped when the field doesn't resolve.

***

### rows?

> `optional` **rows?**: readonly [`PreviewRowSpec`](PreviewRowSpec.md)[]

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:134](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L134)

Labelled property rows, full-width below a divider. Empty values are dropped.

***

### subtitle?

> `optional` **subtitle?**: [`PreviewSubtitleSpec`](PreviewSubtitleSpec.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L132)

Description line, 2-line clamp by default.

***

### title?

> `optional` **title?**: [`PreviewTextSpec`](PreviewTextSpec.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:130](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L130)

Title line (e.g. a display name).
