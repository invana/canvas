# Interface: EdgeData\<D\>

Defined in: [graph/src/layer/types.ts:744](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L744)

Per-instance edge descriptor — stored by GraphStore, concrete values.

## Type Parameters

### D

`D` = `unknown`

## Properties

### data?

> `readonly` `optional` **data?**: `D`

Defined in: [graph/src/layer/types.ts:750](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L750)

***

### id

> `readonly` **id**: `string`

Defined in: [graph/src/layer/types.ts:745](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L745)

***

### source

> `readonly` **source**: `string`

Defined in: [graph/src/layer/types.ts:746](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L746)

***

### state?

> `readonly` `optional` **state?**: `Readonly`\<`Record`\<`string`, [`EdgeStyle`](EdgeStyle.md)\>\>

Defined in: [graph/src/layer/types.ts:752](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L752)

***

### states?

> `readonly` `optional` **states?**: readonly `string`[]

Defined in: [graph/src/layer/types.ts:753](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L753)

***

### style?

> `readonly` `optional` **style?**: [`EdgeStyle`](EdgeStyle.md)

Defined in: [graph/src/layer/types.ts:751](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L751)

***

### target

> `readonly` **target**: `string`

Defined in: [graph/src/layer/types.ts:747](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L747)

***

### type?

> `readonly` `optional` **type?**: `string`

Defined in: [graph/src/layer/types.ts:749](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L749)

Predicate / FK label. Free-form. G6 calls this `type`.
