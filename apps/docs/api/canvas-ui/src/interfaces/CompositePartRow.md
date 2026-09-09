# Interface: CompositePartRow

One flat parts-list row (a `parts.${i}` `ObjectField`). Carries every
possible part field; the editor shows only the subset for the row's `part`
kind (see `partRowFields`). Nested `stroke {}` / `icon` `InsetLayer` and the
label/icon colours are flattened to scalars here and rebuilt in `mapping.ts`.

## Properties

### align?

> `optional` **align?**: `"center"` \| `"left"` \| `"right"`

***

### anchor?

> `optional` **anchor?**: `"center"` \| `"left"` \| `"right"`

***

### cornerRadius?

> `optional` **cornerRadius?**: `number`

***

### fill?

> `optional` **fill?**: `string`

***

### fillAlpha?

> `optional` **fillAlpha?**: `number`

***

### fontSize?

> `optional` **fontSize?**: `number`

***

### fontStyle?

> `optional` **fontStyle?**: `"normal"` \| `"italic"`

***

### fontWeight?

> `optional` **fontWeight?**: `number`

***

### height?

> `optional` **height?**: `number`

***

### hitId?

> `optional` **hitId?**: `string`

Addressable sub-part id for hit-testing (rect / circle / icon).

***

### iconBackgroundFill?

> `optional` **iconBackgroundFill?**: `string`

Chip traced behind the glyph (`#rrggbb`).

***

### iconChar?

> `optional` **iconChar?**: `string`

***

### iconColor?

> `optional` **iconColor?**: `string`

Icon glyph / stroke colour (`#rrggbb`).

***

### iconKind?

> `optional` **iconKind?**: [`CompositeIconKind`](../type-aliases/CompositeIconKind.md)

***

### iconUrl?

> `optional` **iconUrl?**: `string`

***

### labelFill?

> `optional` **labelFill?**: `string`

Label text colour (`#rrggbb`); maps to the label part's `fill`.

***

### lineHeight?

> `optional` **lineHeight?**: `number`

***

### maxLines?

> `optional` **maxLines?**: `number`

***

### maxWidth?

> `optional` **maxWidth?**: `number`

***

### overflow?

> `optional` **overflow?**: `"clip"` \| `"ellipsis"`

***

### part

> **part**: `CompositePart`

***

### radius?

> `optional` **radius?**: `number`

***

### size?

> `optional` **size?**: `number`

***

### strokeAlpha?

> `optional` **strokeAlpha?**: `number`

***

### strokeColor?

> `optional` **strokeColor?**: `string`

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

***

### text?

> `optional` **text?**: `string`

***

### width?

> `optional` **width?**: `number`

***

### x?

> `optional` **x?**: `number`

***

### x2?

> `optional` **x2?**: `number`

***

### y?

> `optional` **y?**: `number`

***

### y2?

> `optional` **y2?**: `number`
