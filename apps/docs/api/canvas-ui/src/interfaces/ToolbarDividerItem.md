# Interface: ToolbarDividerItem

A visual group separator. Compiles to a design-kit `Separator` on the cross axis.

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

### type

> **type**: `"divider"`
