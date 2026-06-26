# Interface: EdgeShapeOptions

Defined in: [graph/src/layer/types.ts:1095](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1095)

Structural variant of an edge — the three-stage connector pipeline
(anchor → router → pathStyle). Variant-specific params live inside
`pathStyleOpts`, so this stays non-discriminated.

## Properties

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1101](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1101)

***

### pathType?

> `readonly` `optional` **pathType?**: [`EdgePathType`](../type-aliases/EdgePathType.md)

Defined in: [graph/src/layer/types.ts:1096](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1096)

***

### sourceAnchor?

> `readonly` `optional` **sourceAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:1097](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1097)

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1099](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1099)

***

### targetAnchor?

> `readonly` `optional` **targetAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:1098](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1098)

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1100](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1100)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]

Defined in: [graph/src/layer/types.ts:1102](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1102)
