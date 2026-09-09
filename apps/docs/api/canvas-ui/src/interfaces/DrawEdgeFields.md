# Interface: DrawEdgeFields

Flat form-field shape the `@invana/forms` generator renders. The nested
`draftStyle` group is flattened to `draft`-prefixed scalars, and its
`dash: [number, number]` tuple is split into two number fields
(`draftDashLength` + `draftDashGap`) — `FieldType` has no tuple/array kind.

## Properties

### allowSelfLoop?

> `optional` **allowSelfLoop?**: `boolean`

***

### draftAlpha?

> `optional` **draftAlpha?**: `number`

***

### draftColor?

> `optional` **draftColor?**: `string`

Preview stroke colour as a `#rrggbb` hex string (the swatch's format).

***

### draftDashGap?

> `optional` **draftDashGap?**: `number`

Dash gap (`draftStyle.dash[1]`).

***

### draftDashLength?

> `optional` **draftDashLength?**: `number`

Dash length (`draftStyle.dash[0]`).

***

### draftWidth?

> `optional` **draftWidth?**: `number`
