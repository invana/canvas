# Interface: ToolbarSelectItem

A single-select dropdown (layout / select-mode / edge-type / shape / zoom). Rendered as a design-kit `RichSelect`.

## Extends

- `ToolbarItemBase`

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Menu alignment relative to the trigger. Default `'start'`.

***

### className?

> `optional` **className?**: `string`

Extra classes for the `'segmented'` group container. Segments are
borderless by default (the ghost toggle variant); pass border utilities here
to opt back into a bordered/outlined segmented control.

***

### display?

> `optional` **display?**: `"dropdown"` \| `"segmented"`

How to render the picker. `'dropdown'` (default) is the collapsed
`RichSelect` trigger + menu. `'segmented'` lays every option out inline as a
single-select `ToggleGroup` (the B / I / U style) — good for a small, always
in-view option set. Segmented items show their per-option icon when present
(icon-only, full label on hover) and fall back to the option label text
otherwise; [triggerLabelOnly](#triggerlabelonly) / [renderTrigger](#rendertrigger) don't apply.

***

### iconClass?

> `optional` **iconClass?**: `string`

Optional className applied to the trigger icon.

***

### icons?

> `optional` **icons?**: `Record`\<`string`, [`ToolbarIcon`](../type-aliases/ToolbarIcon.md)\>

Optional option key → icon, surfaced on the trigger + beside each option.

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

Trigger label + menu heading (e.g. `'Layout'`).

***

### onChange

> **onChange**: (`value`) => `void`

#### Parameters

##### value

`string`

#### Returns

`void`

***

### options

> **options**: `Record`\<`string`, `string`\>

Option key → human label.

***

### renderTrigger?

> `optional` **renderTrigger?**: () => `ReactNode`

Override the trigger content (instead of the default `{label}: {value}`).
Used by the zoom picker to show a live `NN%` even when the current value
isn't one of the preset options.

#### Returns

`ReactNode`

***

### tooltip?

> `optional` **tooltip?**: `string`

Trigger tooltip; defaults to [ToolbarSelectItem.label](#label).

***

### tooltipSide?

> `optional` **tooltipSide?**: [`TooltipSide`](../type-aliases/TooltipSide.md)

***

### triggerLabelOnly?

> `optional` **triggerLabelOnly?**: `boolean`

Show only the section [label](#label) (+ active icon) on the collapsed trigger,
not the selected option's label — so the trigger reads `Select` instead of
`Select: Click select`. Use when the per-option icon already conveys the
choice (e.g. the select-mode picker) and repeating the option name on the
trigger is noise. The open dropdown still lists full option labels. Ignored
when [renderTrigger](#rendertrigger) is provided.

***

### type

> **type**: `"select"`

***

### value

> **value**: `string`

Currently-selected option key.
