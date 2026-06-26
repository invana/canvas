# Interface: CardStructure

Defined in: graph/src/template/types.ts:39

Composite card structure: a fixed-size body laid out as rows of slots.

## Properties

### height

> **height**: `number`

Defined in: graph/src/template/types.ts:45

Fixed card height in world units.

***

### kind

> **kind**: `"card"`

Defined in: graph/src/template/types.ts:41

***

### name

> **name**: `string`

Defined in: graph/src/template/types.ts:40

***

### padding?

> `optional` **padding?**: `number`

Defined in: graph/src/template/types.ts:47

Inner padding (default 14).

***

### rows

> **rows**: [`CardRow`](CardRow.md)[]

Defined in: graph/src/template/types.ts:49

Ordered rows, laid out top → bottom.

***

### width

> **width**: `number`

Defined in: graph/src/template/types.ts:43

Fixed card width in world units. Overflow text ellipsizes.
