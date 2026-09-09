# Interface: D3SankeyLayoutOptions

The subset of `D3SankeyLayoutOptions` this editor produces — a serialisable
patch. `size` is flattened into `sizeWidth` / `sizeHeight`; `center` is kept
nested. Function options (`nodeSort`, `linkSort`) and registry wiring (`id` /
`targetLayerId`) are out of scope. Sankey snaps — there is no `transition`.

## Properties

### center?

> `optional` **center?**: `object`

Translate the projected coordinates by `(x, y)` after layout.

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### iterations?

> `optional` **iterations?**: `number`

Relaxation iterations. Default `6`.

***

### nodeAlign?

> `optional` **nodeAlign?**: `D3SankeyNodeAlign`

Column-alignment strategy. Default `'justify'`.

***

### nodePadding?

> `optional` **nodePadding?**: `number`

Vertical padding between nodes within a column. Default `8`.

***

### nodeWidth?

> `optional` **nodeWidth?**: `number`

Column rectangle width. Default `24`.

***

### size?

> `optional` **size?**: \[`number`, `number`\]

Viewport size `[width, height]` the layout fills. Default `[1000, 600]`.
