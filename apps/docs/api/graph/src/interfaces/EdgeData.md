# Interface: EdgeData\<D\>

Defined in: [graph/src/layer/types.ts:1159](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1159)

Per-instance edge descriptor — stored by GraphStore, concrete values.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1165](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1165)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:1160](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1160)

***

### source

> `readonly` **source**: `string`

Defined in: [graph/src/layer/types.ts:1161](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1161)

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`EdgeStyle`](EdgeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:1167](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1167)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1168](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1168)

***

### style?

> `readonly` `optional` **style?**: [`EdgeStyle`](EdgeStyle.md)

Defined in: [graph/src/layer/types.ts:1166](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1166)

***

### target

> `readonly` **target**: `string`

Defined in: [graph/src/layer/types.ts:1162](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1162)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1164](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L1164)

Predicate / FK label. Free-form. G6 calls this `type`.
