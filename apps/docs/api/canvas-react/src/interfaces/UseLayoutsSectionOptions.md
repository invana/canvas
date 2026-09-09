# Interface: UseLayoutsSectionOptions

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Menu alignment.

***

### canvas?

> `optional` **canvas?**: `Canvas`

Explicit canvas instance; defaults to the context canvas.

***

### fitPadding?

> `optional` **fitPadding?**: `number`

Padding for the post-layout fit. Default `80`.

***

### initial?

> `optional` **initial?**: `string`

Initially-selected key. Default: first key.

***

### label?

> `optional` **label?**: `string`

Trigger label. Default `'Layout'`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Optional key → human label map. Default: identity.

***

### layerId?

> `optional` **layerId?**: `string`

Target `GraphLayer` id. Default `'graph'`.

***

### layouts

> **layouts**: `Record`\<`string`, [`LayoutFactory`](../type-aliases/LayoutFactory.md)\>

Map of layout key → factory producing a fresh layout instance. Memoize it.
