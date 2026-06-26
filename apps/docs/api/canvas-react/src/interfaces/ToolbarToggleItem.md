# Interface: ToolbarToggleItem

Defined in: [canvas-react/src/components/ToolbarItem.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L51)

A two-state toggle (lock view, grid, theme, modeller tool, …). Rendered as a
ghost `Button` with the design-kit nav-item active treatment; the icon and
label flip with [ToolbarToggleItem.active](#active).

## Extends

- `ToolbarItemBase`

## Properties

### active

> **active**: `boolean`

Defined in: [canvas-react/src/components/ToolbarItem.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L63)

***

### activeIcon?

> `optional` **activeIcon?**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:56](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L56)

Icon shown while active. Defaults to `icon` — active styling alone signals state.

***

### activeLabel?

> `optional` **activeLabel?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L62)

Tooltip + label in the active state. Defaults to `label`.

***

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: [canvas-react/src/components/ToolbarItem.ts:66](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L66)

Greys the button and blocks the toggle. Default `false`.

***

### icon

> **icon**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L54)

Icon shown while inactive (and while active, unless `activeIcon` is set).

***

### iconClass?

> `optional` **iconClass?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:58](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L58)

Optional className applied to the rendered icon (sizing / colour / state tint).

***

### key?

> `optional` **key?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L21)

Stable React key for the rendered control. Builder hooks set semantic keys
(e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
falls back to `` `${type}-${index}` `` when omitted.

#### Inherited from

`ToolbarItemBase.key`

***

### label

> **label**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L60)

Tooltip + label in the inactive state.

***

### onToggle

> **onToggle**: () => `void`

Defined in: [canvas-react/src/components/ToolbarItem.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L64)

#### Returns

`void`

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L67)

***

### type

> **type**: `"toggle"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L52)
