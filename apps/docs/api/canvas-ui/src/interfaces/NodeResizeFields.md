# Interface: NodeResizeFields

Flat form-field shape the `@invana/forms` generator renders. Colours become
`#rrggbb` strings; the `dashArray` tuple is flattened into `dashLength` +
`dashGap` number fields (see `mapping.ts`).

## Properties

### dashGap?

> `optional` **dashGap?**: `number`

Second tuple member of `dashArray` — the gap length in px.

***

### dashLength?

> `optional` **dashLength?**: `number`

First tuple member of `dashArray` — the dash length in px.

***

### frameColor?

> `optional` **frameColor?**: `string`

Frame colour as a `#rrggbb` swatch string.

***

### framePadding?

> `optional` **framePadding?**: `number`

***

### handleFill?

> `optional` **handleFill?**: `string`

Handle fill as a `#rrggbb` swatch string.

***

### handleRadius?

> `optional` **handleRadius?**: `number`

***

### minSize?

> `optional` **minSize?**: `number`
