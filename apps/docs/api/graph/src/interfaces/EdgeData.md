# Interface: EdgeData\<D\>

Defined in: [graph/src/layer/types.ts:1212](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1212)

Per-instance edge descriptor — stored by GraphStore, concrete values.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:1218](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1218)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:1213](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1213)

***

### source

> `readonly` **source**: `string`

Defined in: [graph/src/layer/types.ts:1214](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1214)

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`EdgeStyle`](EdgeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:1220](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1220)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:1221](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1221)

***

### style?

> `readonly` `optional` **style?**: [`EdgeStyle`](EdgeStyle.md)

Defined in: [graph/src/layer/types.ts:1219](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1219)

***

### target

> `readonly` **target**: `string`

Defined in: [graph/src/layer/types.ts:1215](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1215)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:1217](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L1217)

Predicate / FK label. Free-form. G6 calls this `type`.
