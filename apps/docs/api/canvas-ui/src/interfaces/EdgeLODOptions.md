# Interface: EdgeLODOptions

The subset of `EdgeLODBehaviourOptions` this editor produces. The base
`id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.

## Properties

### keepBy?

> `optional` **keepBy?**: [`EdgeLODKeepBy`](../type-aliases/EdgeLODKeepBy.md)

Which edges survive: stable `'sample'`, highest `'weight'`, or `'degree'` backbone.

***

### keepFraction?

> `optional` **keepFraction?**: `number`

Fraction of edges kept visible when thinned, in `(0, 1]`. Default `0.1`.

***

### minZoom?

> `optional` **minZoom?**: `number`

Thin edges when `camera.scale` is below this. Default `0.5`.

***

### weightKey?

> `optional` **weightKey?**: `string`

Numeric edge-`data` field used when `keepBy: 'weight'`.
