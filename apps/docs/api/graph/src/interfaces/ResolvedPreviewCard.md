# Interface: ResolvedPreviewCard

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:174](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L174)

The render-ready card — all field paths resolved against the hovered element
to concrete primitives. The consumer renders this directly; no field logic
leaks into the UI.

## Properties

### id

> **id**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:176](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L176)

Element id (rendered in the header strip).

***

### imageShape

> **imageShape**: `"circle"` \| `"rounded"`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:183](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L183)

Avatar shape — always concrete (defaults applied).

***

### imageUrl?

> `optional` **imageUrl?**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:181](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L181)

Resolved image URL, or `undefined` to skip the avatar column.

***

### kind

> **kind**: [`GraphElementKind`](../type-aliases/GraphElementKind.md)

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:177](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L177)

***

### rows

> **rows**: [`PreviewCardRow`](PreviewCardRow.md)[]

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:191](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L191)

Resolved property rows (empty values already dropped).

***

### subtitle?

> `optional` **subtitle?**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:187](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L187)

Resolved description text, if the field resolved.

***

### subtitleMaxLines

> **subtitleMaxLines**: `number`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:189](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L189)

Line clamp for the subtitle — always concrete.

***

### title?

> `optional` **title?**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:185](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L185)

Resolved title text, if the field resolved.

***

### type?

> `optional` **type?**: `string`

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:179](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L179)

Element `type` tag, if any (rendered in the header strip beside the id).
