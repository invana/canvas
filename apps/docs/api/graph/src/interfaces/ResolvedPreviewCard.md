# Interface: ResolvedPreviewCard

The render-ready card — all field paths resolved against the hovered element
to concrete primitives. The consumer renders this directly; no field logic
leaks into the UI.

## Properties

### id

> **id**: `string`

Element id (rendered in the header strip).

***

### imageShape

> **imageShape**: `"circle"` \| `"rounded"`

Avatar shape — always concrete (defaults applied).

***

### imageUrl?

> `optional` **imageUrl?**: `string`

Resolved image URL, or `undefined` to skip the avatar column.

***

### kind

> **kind**: [`GraphElementKind`](../type-aliases/GraphElementKind.md)

***

### rows

> **rows**: [`PreviewCardRow`](PreviewCardRow.md)[]

Resolved property rows (empty values already dropped).

***

### subtitle?

> `optional` **subtitle?**: `string`

Resolved description text, if the field resolved.

***

### subtitleMaxLines

> **subtitleMaxLines**: `number`

Line clamp for the subtitle — always concrete.

***

### title?

> `optional` **title?**: `string`

Resolved title text, if the field resolved.

***

### type?

> `optional` **type?**: `string`

Element `type` tag, if any (rendered in the header strip beside the id).
