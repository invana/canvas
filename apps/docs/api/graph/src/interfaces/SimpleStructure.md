# Interface: SimpleStructure

Defined in: graph/src/template/types.ts:29

Simple structure: one shape with a single label slot (the lean render path).

## Properties

### kind

> **kind**: `"simple"`

Defined in: graph/src/template/types.ts:31

***

### name

> **name**: `string`

Defined in: graph/src/template/types.ts:30

***

### shape

> **shape**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

Defined in: graph/src/template/types.ts:33

The node's shape (circle / rect / arc / regular-polygon / star / polygon).

***

### slots?

> `optional` **slots?**: `object`

Defined in: graph/src/template/types.ts:35

Declared slots. `label` is always present; icon/badge reserved for later.

#### badge?

> `optional` **badge?**: `boolean`

#### icon?

> `optional` **icon?**: `boolean`

#### label?

> `optional` **label?**: `boolean`
