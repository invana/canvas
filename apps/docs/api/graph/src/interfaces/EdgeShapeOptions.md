# Interface: EdgeShapeOptions

Defined in: [graph/src/layer/types.ts:1042](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1042)

Structural variant of an edge — the three-stage connector pipeline
(anchor → router → pathStyle). Variant-specific params live inside
`pathStyleOpts`, so this stays non-discriminated.

## Properties

### pathStyleOpts?

> `readonly` `optional` **pathStyleOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1048](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1048)

***

### pathType?

> `readonly` `optional` **pathType?**: [`EdgePathType`](../type-aliases/EdgePathType.md)

Defined in: [graph/src/layer/types.ts:1043](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1043)

***

### sourceAnchor?

> `readonly` `optional` **sourceAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:1044](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1044)

***

### sourceAnchorOpts?

> `readonly` `optional` **sourceAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1046](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1046)

***

### targetAnchor?

> `readonly` `optional` **targetAnchor?**: [`EdgeAnchor`](../type-aliases/EdgeAnchor.md)

Defined in: [graph/src/layer/types.ts:1045](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1045)

***

### targetAnchorOpts?

> `readonly` `optional` **targetAnchorOpts?**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [graph/src/layer/types.ts:1047](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1047)

***

### waypoints?

> `readonly` `optional` **waypoints?**: readonly `object`[]

Defined in: [graph/src/layer/types.ts:1049](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1049)
