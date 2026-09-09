# Interface: GraphLegendRow

One tallied type, ready to render — the unit
[GraphLegendLayer.getRows](../classes/GraphLegendLayer.md#getrows) hands back.

## Properties

### color

> **color**: `number`

Resolved swatch colour as `0xRRGGBB`.

***

### dashed?

> `optional` **dashed?**: `boolean`

Edge rows only — true when the resolved style dashes the path.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Edge rows only — the resolved stroke width, for the swatch line's thickness.

***

### total

> **total**: `number`

How many are loaded in the store, hidden or not.

***

### type

> **type**: `string`

The type name, as the accessor reported it.

***

### visible

> **visible**: `number`

How many are currently rendered (not hidden, endpoints visible for edges).
