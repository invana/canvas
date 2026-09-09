# Interface: CardStructure

Composite card structure: a fixed-size body laid out as rows of slots.

## Properties

### frame?

> `optional` **frame?**: `CompositeFrame`

Background silhouette filling the card box. Omit for a rounded rectangle;
set a circle/ellipse, polygon, etc. to make the card that shape (fill,
border and every state decoration follow it).

***

### height

> **height**: `number`

Fixed card height in world units.

***

### kind

> **kind**: `"card"`

***

### name

> **name**: `string`

***

### padding?

> `optional` **padding?**: `number`

Inner padding (default 14).

***

### rows

> **rows**: [`CardRow`](CardRow.md)[]

Ordered rows, laid out top → bottom.

***

### width

> **width**: `number`

Fixed card width in world units. Overflow text ellipsizes.
