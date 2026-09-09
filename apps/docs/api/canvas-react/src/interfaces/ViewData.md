# Interface: ViewData

The single viewed node/edge resolved to its display fields. Read-only.

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Current `data` as a flat map. Values keep their original type (number,
string, array, object, …) so a viewer can render each property by kind —
`null` / `undefined` entries are dropped. See `PropertyDetailView`.

***

### id

> **id**: `string`

***

### kind

> **kind**: `"node"` \| `"edge"`

***

### label

> **label**: `string`

Effective (resolved) label text. Empty for edges (they have no label field).

***

### source?

> `optional` **source?**: `string`

Source node id — edges only.

***

### target?

> `optional` **target?**: `string`

Target node id — edges only.

***

### type?

> `optional` **type?**: `string`

The element's free-form `type` tag, when set.
