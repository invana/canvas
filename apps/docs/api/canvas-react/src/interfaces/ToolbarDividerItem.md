# Interface: ToolbarDividerItem

Defined in: [canvas-react/src/components/ToolbarItem.ts:98](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L98)

A visual group separator. Compiles to a design-kit `Separator` on the cross axis.

## Extends

- `ToolbarItemBase`

## Properties

### key?

> `optional` **key?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L21)

Stable React key for the rendered control. Builder hooks set semantic keys
(e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
falls back to `` `${type}-${index}` `` when omitted.

#### Inherited from

`ToolbarItemBase.key`

***

### type

> **type**: `"divider"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:99](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L99)
