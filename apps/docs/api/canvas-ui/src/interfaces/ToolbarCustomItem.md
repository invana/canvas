# Interface: ToolbarCustomItem

An escape hatch for arbitrary content that doesn't fit the
button/toggle/select mould — e.g. a live zoom readout, a brand element, or a
consumer's own widget. The renderer calls [ToolbarCustomItem.render](#render)
and drops the result inline.

## Extends

- `ToolbarItemBase`

## Properties

### key?

> `optional` **key?**: `string`

Stable React key for the rendered control. Builder hooks set semantic keys
(e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
falls back to `` `${type}-${index}` `` when omitted.

#### Inherited from

`ToolbarItemBase.key`

***

### render

> **render**: () => `ReactNode`

#### Returns

`ReactNode`

***

### type

> **type**: `"custom"`
