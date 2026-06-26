# Interface: ToolbarSelectItem

Defined in: [canvas-react/src/components/ToolbarItem.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L71)

A single-select dropdown (layout / select-mode / edge-type / shape / zoom). Rendered as a design-kit `RichSelect`.

## Extends

- `ToolbarItemBase`

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L85)

Menu alignment relative to the trigger. Default `'start'`.

***

### iconClass?

> `optional` **iconClass?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:82](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L82)

Optional className applied to the trigger icon.

***

### icons?

> `optional` **icons?**: `Record`\<`string`, [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)\>

Defined in: [canvas-react/src/components/ToolbarItem.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L80)

Optional option key → icon, surfaced on the trigger + beside each option.

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

Defined in: [canvas-react/src/components/ToolbarItem.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L74)

Trigger label + menu heading (e.g. `'Layout'`).

***

### onChange

> **onChange**: (`value`) => `void`

Defined in: [canvas-react/src/components/ToolbarItem.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L83)

#### Parameters

##### value

`string`

#### Returns

`void`

***

### options

> **options**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/components/ToolbarItem.ts:78](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L78)

Option key → human label.

***

### renderTrigger?

> `optional` **renderTrigger?**: () => `any`

Defined in: [canvas-react/src/components/ToolbarItem.ts:94](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L94)

Override the trigger content (instead of the default `{label}: {value}`).
Used by the zoom picker to show a live `NN%` even when the current value
isn't one of the preset options.

#### Returns

`any`

***

### tooltip?

> `optional` **tooltip?**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L87)

Trigger tooltip; defaults to [ToolbarSelectItem.label](#label).

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

Defined in: [canvas-react/src/components/ToolbarItem.ts:88](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L88)

***

### type

> **type**: `"select"`

Defined in: [canvas-react/src/components/ToolbarItem.ts:72](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L72)

***

### value

> **value**: `string`

Defined in: [canvas-react/src/components/ToolbarItem.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/ToolbarItem.ts#L76)

Currently-selected option key.
