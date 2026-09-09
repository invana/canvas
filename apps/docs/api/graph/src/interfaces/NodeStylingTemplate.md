# Interface: NodeStylingTemplate

Per-type styling: roles + typography. Every colour is a **pair** — a `*Role`
field (themed, resolved from the active palette) **or** a direct numeric field
(fixed literal). `*Role` wins when both are set.

## Properties

### accent?

> `optional` **accent?**: `number`

***

### accentRole?

> `optional` **accentRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

***

### bg?

> `optional` **bg?**: `number`

***

### bgRole?

> `optional` **bgRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

***

### fill?

> `optional` **fill?**: `number`

***

### fillRole?

> `optional` **fillRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

***

### label?

> `optional` **label?**: [`LabelStyling`](LabelStyling.md)

***

### name

> **name**: `string`

***

### slots?

> `optional` **slots?**: `Record`\<`string`, [`SlotStyling`](SlotStyling.md)\>

Per-slot styling, keyed by slot name (e.g. `title`, `subtitle`, `divider`).

***

### stroke?

> `optional` **stroke?**: `number`

***

### strokeRole?

> `optional` **strokeRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

Border colour — applies to **both** structure kinds: it becomes the shape's
`bgStrokeColor` on a `simple` structure, and the composite silhouette's own
stroke on a `card` (so it traces a custom `frame` too). Defaults to no
border when unset; [strokeWidth](#strokewidth) defaults to `1` on a card and `1.5`
on a simple shape.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`
