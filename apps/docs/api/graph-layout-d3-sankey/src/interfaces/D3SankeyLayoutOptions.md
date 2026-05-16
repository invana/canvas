# Interface: D3SankeyLayoutOptions

Defined in: [graph-layout-d3-sankey/src/types.ts:41](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L41)

`D3SankeyLayout` options.

Mirrors `d3-sankey`'s configuration surface 1:1. All fields are optional;
defaults follow d3's defaults except `size`, which defaults to
`[1000, 600]` so a fresh layout has somewhere to draw.

## Properties

### center?

> `optional` **center?**: `object`

Defined in: [graph-layout-d3-sankey/src/types.ts:78](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L78)

Translate the projected coordinates by `(x, y)` after layout. Default
`{ x: 0, y: 0 }`. Useful for centring the diagram around the world
origin so a fresh `fitContent` frames it naturally.

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### iterations?

> `optional` **iterations?**: `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:55](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L55)

Relaxation iterations. More = tighter packing, slower run. Default `6`.

***

### linkSort?

> `optional` **linkSort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:71](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L71)

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

Defined in: [graph-layout-d3-sankey/src/types.ts:58](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L58)

Column-alignment strategy. See [D3SankeyNodeAlign](../type-aliases/D3SankeyNodeAlign.md). Default `'justify'`.

***

### nodePadding?

> `optional` **nodePadding?**: `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:52](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L52)

Vertical padding between nodes within a column. Default `8` (d3's default).

***

### nodeSort?

> `optional` **nodeSort?**: (`a`, `b`) => `number`

Defined in: [graph-layout-d3-sankey/src/types.ts:65](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L65)

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

Defined in: [graph-layout-d3-sankey/src/types.ts:49](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L49)

Column rectangle width in pixels. Default `24` (d3's default).

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Defined in: [graph-layout-d3-sankey/src/types.ts:46](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-sankey/src/types.ts#L46)

Viewport size `[width, height]` the layout fills. Translated to
`d3.sankey().extent([[0, 0], [width, height]])`. Default `[1000, 600]`.
