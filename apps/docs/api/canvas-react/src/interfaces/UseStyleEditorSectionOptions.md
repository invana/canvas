# Interface: UseStyleEditorSectionOptions

## Properties

### align?

> `optional` **align?**: `"center"` \| `"start"` \| `"end"`

Menu alignment.

***

### canvas?

> `optional` **canvas?**: `Canvas`

Explicit canvas instance; defaults to the context canvas.

***

### initial?

> `optional` **initial?**: `EdgePathType`

Initially-selected path type. Default: the layer's current edge default.

***

### label?

> `optional` **label?**: `string`

Trigger label. Default `'Edge'`.

***

### labels?

> `optional` **labels?**: `Record`\<`string`, `string`\>

Optional key → human label map. Default: the built-in path-type labels.

***

### layerId?

> `optional` **layerId?**: `string`

Target `GraphLayer` id. Default `'graph'`.

***

### types?

> `optional` **types?**: readonly `EdgePathType`[]

Path types to expose, in order. Default: straight / orth / bezier / rounded / smooth.
