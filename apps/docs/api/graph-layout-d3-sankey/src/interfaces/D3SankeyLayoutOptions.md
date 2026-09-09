# Interface: D3SankeyLayoutOptions

`D3SankeyLayout` options.

Mirrors `d3-sankey`'s configuration surface 1:1. All fields are optional;
defaults follow d3's defaults except `size`, which defaults to
`[1000, 600]` so a fresh layout has somewhere to draw.

Extends [LayoutOptions](../../../canvas/src/interfaces/LayoutOptions.md), so it also accepts `id` / `targetLayerId`
(registry + `config.activeLayout` wiring). Sankey snaps (no position
transition — it replaces node rect sizes + edge ribbons).

## Extends

- [`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md)

## Properties

### center?

> `optional` **center?**: `object`

Translate the projected coordinates by `(x, y)` after layout. Default
`{ x: 0, y: 0 }`. Useful for centring the diagram around the world
origin so a fresh `fitContent` frames it naturally.

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### id?

> `optional` **id?**: `string`

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

[`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md).[`id`](../../../canvas/src/interfaces/LayoutOptions.md#id)

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the layout. Default `false` — hidden
nodes (and links touching them) are excluded so they don't take up columns,
and their last positions stay frozen.

***

### iterations?

> `optional` **iterations?**: `number`

Relaxation iterations. More = tighter packing, slower run. Default `6`.

***

### linkSort?

> `optional` **linkSort?**: (`a`, `b`) => `number`

Link sort within each node's source-side / target-side stack. `null`
preserves d3's default order; `undefined` falls back to the default.

#### Parameters

##### a

`SankeyLinkRef`

##### b

`SankeyLinkRef`

#### Returns

`number`

***

### nodeAlign?

> `optional` **nodeAlign?**: [`D3SankeyNodeAlign`](../type-aliases/D3SankeyNodeAlign.md)

Column-alignment strategy. See [D3SankeyNodeAlign](../type-aliases/D3SankeyNodeAlign.md). Default `'justify'`.

***

### nodePadding?

> `optional` **nodePadding?**: `number`

Vertical padding between nodes within a column. Default `8` (d3's default).

***

### nodeSort?

> `optional` **nodeSort?**: (`a`, `b`) => `number`

Sibling node sort within a column. `null` preserves d3's default
(ascending by incoming flow); `undefined` falls back to the default;
a function sorts explicitly.

#### Parameters

##### a

`SankeyNodeRef`

##### b

`SankeyNodeRef`

#### Returns

`number`

***

### nodeWidth?

> `optional` **nodeWidth?**: `number`

Column rectangle width in pixels. Default `24` (d3's default).

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Viewport size `[width, height]` the layout fills. Translated to
`d3.sankey().extent([[0, 0], [width, height]])`. Default `[1000, 600]`.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

[`LayoutOptions`](../../../canvas/src/interfaces/LayoutOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/LayoutOptions.md#targetlayerid)
