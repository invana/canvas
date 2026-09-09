# Interface: UseEditorSectionOptions

## Properties

### canvas?

> `optional` **canvas?**: `Canvas`

Explicit canvas instance; defaults to the context canvas.

***

### clickSelectId?

> `optional` **clickSelectId?**: `string`

Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`.

***

### items?

> `optional` **items?**: [`EditorItemKey`](../type-aliases/EditorItemKey.md)[]

Which items to include, in canonical (cut · copy · paste · erase) order.
Default: all four. Pass e.g. `['erase']` for an erase-only bar (no
clipboard) — cut/copy/paste are simply omitted.

***

### layerId?

> `optional` **layerId?**: `string`

Layer that erase / clipboard target. Default `'graph'`.
