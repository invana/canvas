# Interface: ToolbarButtonItem

A plain action button. Rendered as a design-kit ghost `Button`.

## Extends

- `ToolbarItemBase`

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

Greys the button and blocks the click. Default `false`.

***

### icon

> **icon**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Icon component (icon-agnostic — e.g. a `lucide-react` glyph).

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

Tooltip content + accessible label.

***

### onClick

> **onClick**: () => `void`

#### Returns

`void`

***

### text?

> `optional` **text?**: `string`

Optional visible text shown next to the icon. When set, the button renders
as a labelled `'sm'` button (not icon-only) — e.g. the selection-aware
clear's "Selection" affordance.

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

Tooltip-side override; otherwise the renderer's `tooltipSide` applies.

***

### type

> **type**: `"button"`
