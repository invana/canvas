# Interface: NodeStylingTemplate

Defined in: graph/src/template/types.ts:73

Per-type styling: roles + typography. Every colour is a **pair** — a `*Role`
field (themed, resolved from the active palette) **or** a direct numeric field
(fixed literal). `*Role` wins when both are set.

## Properties

### accent?

> `optional` **accent?**: `number`

Defined in: graph/src/template/types.ts:86

***

### accentRole?

> `optional` **accentRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

Defined in: graph/src/template/types.ts:85

***

### bg?

> `optional` **bg?**: `number`

Defined in: graph/src/template/types.ts:84

***

### bgRole?

> `optional` **bgRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

Defined in: graph/src/template/types.ts:83

***

### fill?

> `optional` **fill?**: `number`

Defined in: graph/src/template/types.ts:77

***

### fillRole?

> `optional` **fillRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

Defined in: graph/src/template/types.ts:76

***

### label?

> `optional` **label?**: [`LabelStyling`](LabelStyling.md)

Defined in: graph/src/template/types.ts:81

***

### name

> **name**: `string`

Defined in: graph/src/template/types.ts:74

***

### slots?

> `optional` **slots?**: `Record`\<`string`, [`SlotStyling`](SlotStyling.md)\>

Defined in: graph/src/template/types.ts:88

Per-slot styling, keyed by slot name (e.g. `title`, `subtitle`, `divider`).

***

### stroke?

> `optional` **stroke?**: `number`

Defined in: graph/src/template/types.ts:79

***

### strokeRole?

> `optional` **strokeRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

Defined in: graph/src/template/types.ts:78

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Defined in: graph/src/template/types.ts:80
