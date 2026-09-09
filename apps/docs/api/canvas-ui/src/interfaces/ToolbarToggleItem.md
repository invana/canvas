# Interface: ToolbarToggleItem

A two-state toggle (lock view, grid, theme, modeller tool, …). Rendered as a
ghost `Button` with the design-kit nav-item active treatment; the icon and
label flip with [ToolbarToggleItem.active](#active).

## Extends

- `ToolbarItemBase`

## Properties

### active

> **active**: `boolean`

***

### activeIcon?

> `optional` **activeIcon?**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Icon shown while active. Defaults to `icon` — active styling alone signals state.

***

### activeLabel?

> `optional` **activeLabel?**: `string`

Tooltip + label in the active state. Defaults to `label`.

***

### disabled?

> `optional` **disabled?**: `boolean`

Greys the button and blocks the toggle. Default `false`.

***

### icon

> **icon**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Icon shown while inactive (and while active, unless `activeIcon` is set).

***

### iconClass?

> `optional` **iconClass?**: `string`

Optional className applied to the rendered icon (sizing / colour / state tint).

***

### key?

> `optional` **key?**: `string`

Stable React key for the rendered control. Builder hooks set semantic keys
(e.g. `'undo'`, `'lock'`) so reorders/conditionals stay stable; the renderer
falls back to `` `${type}-${index}` `` when omitted.

#### Inherited from

`ToolbarItemBase.key`

***

### label

> **label**: `string`

Tooltip + label in the inactive state.

***

### onToggle

> **onToggle**: () => `void`

#### Returns

`void`

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

***

### type

> **type**: `"toggle"`
