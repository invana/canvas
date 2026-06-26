# Interface: ToolbarButtonItem

Defined in: [canvas-react/src/components/ToolbarItem.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L25)

A plain action button. Rendered as a design-kit ghost `Button`.

## Extends

- `ToolbarItemBase`

## Properties

### disabled?

> `optional` **disabled?**: `boolean`

Defined in: [canvas-react/src/components/ToolbarItem.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L41)

Greys the button and blocks the click. Default `false`.

***

### icon

> **icon**: [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:28](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L28)

Icon component (icon-agnostic — e.g. a `lucide-react` glyph).

***

### iconClass?

> `optional` **iconClass?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L30)

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

Defined in: [canvas-react/src/components/ToolbarItem.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L32)

Tooltip content + accessible label.

***

### onClick

> **onClick**: () => `void`

Defined in: [canvas-react/src/components/ToolbarItem.ts:39](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L39)

#### Returns

`void`

***

### text?

> `optional` **text?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:38](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L38)

Optional visible text shown next to the icon. When set, the button renders
as a labelled `'sm'` button (not icon-only) — e.g. the selection-aware
clear's "Selection" affordance.

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L43)

Tooltip-side override; otherwise the renderer's `tooltipSide` applies.

***

### type

> **type**: `"button"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L26)
