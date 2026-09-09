# Interface: EdgeShapeOptions

Structural variant of an edge — the three-stage connector pipeline
(anchor → router → pathStyle). Variant-specific params live inside
`pathStyleOpts`, so this stays non-discriminated.

## Properties

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

***

### pathType?

> `readonly` `optional` **pathType?**: [`EdgePathType`](../type-aliases/EdgePathType.md)

***

### sourceAnchor?

> `readonly` `optional` **sourceAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

***

### targetAnchor?

> `readonly` `optional` **targetAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]
