# Interface: HoverElementPreviewCardSpec

The serializable preview-card template. Pure JSON — author it in display
settings and feed it verbatim. `id` + `type` are rendered automatically
(structural, from the resolved target) and need no field entry here.

## Properties

### image?

> `optional` **image?**: [`PreviewImageSpec`](PreviewImageSpec.md)

Left avatar; the whole block is skipped when the field doesn't resolve.

***

### rows?

> `optional` **rows?**: readonly [`PreviewRowSpec`](PreviewRowSpec.md)[]

Labelled property rows, full-width below a divider. Empty values are dropped.

***

### subtitle?

> `optional` **subtitle?**: [`PreviewSubtitleSpec`](PreviewSubtitleSpec.md)

Description line, 2-line clamp by default.

***

### title?

> `optional` **title?**: [`PreviewTextSpec`](PreviewTextSpec.md)

Title line (e.g. a display name).
