# Interface: FreeformStructure

A self-contained composite card placed by absolute coordinates — the JSON the
visual card designer emits. Carries its own background, element list, data
bindings and colour roles, so a node type only needs to reference it by name
(no separate styling/binding template). Compiles straight to the engine's
`composite` shape; themed because every colour is a [ColorRole](../type-aliases/ColorRole.md).

## Properties

### bg?

> `optional` **bg?**: `number`

***

### bgRole?

> `optional` **bgRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

***

### cornerRadius?

> `optional` **cornerRadius?**: `number`

***

### elements

> **elements**: [`CardElement`](../type-aliases/CardElement.md)[]

***

### frame?

> `optional` **frame?**: `CompositeFrame`

Background silhouette filling the card box. Omit for a rounded rectangle
(using [cornerRadius](#cornerradius)); set a circle/ellipse, polygon, etc. to make
the card that shape — fill, border and decorations follow it.

***

### height

> **height**: `number`

***

### kind

> **kind**: `"freeform"`

***

### name

> **name**: `string`

***

### stroke?

> `optional` **stroke?**: `number`

***

### strokeRole?

> `optional` **strokeRole?**: [`ColorRole`](../type-aliases/ColorRole.md)

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

***

### width

> **width**: `number`
