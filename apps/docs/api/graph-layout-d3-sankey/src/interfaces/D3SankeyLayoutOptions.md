# Interface: D3SankeyLayoutOptions

Defined in: [graph-layout-d3-sankey/src/types.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L46)

`D3SankeyLayout` options.

Mirrors `d3-sankey`'s configuration surface 1:1. All fields are optional;
defaults follow d3's defaults except `size`, which defaults to
`[1000, 600]` so a fresh layout has somewhere to draw.

Extends LayoutOptions, so it also accepts `id` / `targetLayerId`
(registry + `config.activeLayout` wiring). Sankey snaps (no position
transition — it replaces node rect sizes + edge ribbons).

## Extends

- `LayoutOptions`

## Properties

### center?

> `optional` **center?**: `object`

Defined in: [graph-layout-d3-sankey/src/types.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L83)

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

Defined in: canvas/dist/index.d.ts:1862

Stable id, used to address the layout in a `LayoutRegistry` / config. Default `'layout'`.

#### Inherited from

`LayoutOptions.id`

***

### iterations?

> `optional` **iterations?**: `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L60)

Relaxation iterations. More = tighter packing, slower run. Default `6`.

***

### linkSort?

> `optional` **linkSort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:76](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L76)

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

Defined in: [graph-layout-d3-sankey/src/types.ts:63](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L63)

Column-alignment strategy. See [D3SankeyNodeAlign](../type-aliases/D3SankeyNodeAlign.md). Default `'justify'`.

***

### nodePadding?

> `optional` **nodePadding?**: `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L57)

Vertical padding between nodes within a column. Default `8` (d3's default).

***

### nodeSort?

> `optional` **nodeSort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:70](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L70)

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

Defined in: [graph-layout-d3-sankey/src/types.ts:54](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L54)

Column rectangle width in pixels. Default `24` (d3's default).

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-sankey/src/types.ts:51](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-sankey/src/types.ts#L51)

Viewport size `[width, height]` the layout fills. Translated to
`d3.sankey().extent([[0, 0], [width, height]])`. Default `[1000, 600]`.

***

### targetLayerId?

> `optional` **targetLayerId?**: `string`

Defined in: canvas/dist/index.d.ts:1864

The layer this layout is meant to run against. Informational — `apply(layer)` still takes one explicitly.

#### Inherited from

`LayoutOptions.targetLayerId`
