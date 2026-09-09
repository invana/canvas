# Interface: ContextMenuFields

Flat form-field shape the `@invana/forms` generator renders. The `targets`
array is flattened into one boolean per kind (`FieldType` has no array), and
`state` renders as a text input.

## Properties

### state?

> `optional` **state?**: `string`

Transient state name applied to the right-clicked element. Empty = none.

***

### targetCanvas?

> `optional` **targetCanvas?**: `boolean`

Fire on right-clicking empty canvas (`targets` includes `'canvas'`).

***

### targetEdge?

> `optional` **targetEdge?**: `boolean`

Fire on right-clicking an edge (`targets` includes `'edge'`).

***

### targetNode?

> `optional` **targetNode?**: `boolean`

Fire on right-clicking a node (`targets` includes `'node'`).
