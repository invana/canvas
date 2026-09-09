# Interface: SimpleStructure

Simple structure: one shape with a single label slot (the lean render path).

## Properties

### kind

> **kind**: `"simple"`

***

### name

> **name**: `string`

***

### shape

> **shape**: [`NodeShapeOptions`](../type-aliases/NodeShapeOptions.md)

The node's shape (circle / rect / arc / regular-polygon / star / polygon).

***

### slots?

> `optional` **slots?**: `object`

Declared slots. `label` is always present; icon/badge reserved for later.

#### badge?

> `optional` **badge?**: `boolean`

#### icon?

> `optional` **icon?**: `boolean`

#### label?

> `optional` **label?**: `boolean`
