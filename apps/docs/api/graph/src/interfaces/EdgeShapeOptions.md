# Interface: EdgeShapeOptions

Defined in: [graph/src/layer/types.ts:653](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L653)

Structural variant of an edge — the three-stage connector pipeline
(anchor → router → pathStyle). Variant-specific params live inside
`pathStyleOpts`, so this stays non-discriminated.

## Properties

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:659](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L659)

***

### pathType?

> `readonly` `optional` **pathType?**: [`EdgePathType`](../type-aliases/EdgePathType.md)

Defined in: [graph/src/layer/types.ts:654](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L654)

***

### sourceAnchor?

> `readonly` `optional` **sourceAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:655](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L655)

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:657](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L657)

***

### targetAnchor?

> `readonly` `optional` **targetAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:656](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L656)

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:658](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L658)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]

Defined in: [graph/src/layer/types.ts:660](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L660)
