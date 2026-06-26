# Interface: ToolbarCustomItem

Defined in: [canvas-react/src/components/ToolbarItem.ts:108](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L108)

An escape hatch for arbitrary content that doesn't fit the
button/toggle/select mould — e.g. a live zoom readout, a brand element, or a
consumer's own widget. The renderer calls [ToolbarCustomItem.render](#render)
and drops the result inline.

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

### render

> **render**: () => `any`

Defined in: [canvas-react/src/components/ToolbarItem.ts:110](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L110)

#### Returns

`any`

***

### type

> **type**: `"custom"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:109](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L109)
