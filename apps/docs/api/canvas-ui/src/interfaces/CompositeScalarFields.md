# Interface: CompositeScalarFields

Body + root scalar controls the editor renders under the `composite`
`ObjectField`. Colours are `#rrggbb` strings (the swatch encoding); the root
discriminated union is flattened to `rootKind` + per-kind geometry numbers,
mirroring the simple editor's `shapeKind` handling. `mapping.ts` round-trips
this against the `CompositeShapeOption` body + `root`.

## Properties

### clip?

> `optional` **clip?**: `boolean`

Clip parts to the root silhouette (edge-touching parts follow the corners).

***

### cornerRadius?

> `optional` **cornerRadius?**: `number`

***

### fill?

> `optional` **fill?**: `string`

Body fill (`#rrggbb`). Also painted onto a chosen root silhouette.

***

### fillAlpha?

> `optional` **fillAlpha?**: `number`

***

### height?

> `optional` **height?**: `number`

***

### rootCornerRadius?

> `optional` **rootCornerRadius?**: `number`

***

### rootHeight?

> `optional` **rootHeight?**: `number`

***

### rootInnerRadius?

> `optional` **rootInnerRadius?**: `number`

***

### rootKind?

> `optional` **rootKind?**: [`CompositeRootKind`](../type-aliases/CompositeRootKind.md)

***

### rootOuterRadius?

> `optional` **rootOuterRadius?**: `number`

***

### rootPoints?

> `optional` **rootPoints?**: `number`

***

### rootRadius?

> `optional` **rootRadius?**: `number`

***

### rootSides?

> `optional` **rootSides?**: `number`

***

### rootWidth?

> `optional` **rootWidth?**: `number`

***

### strokeAlpha?

> `optional` **strokeAlpha?**: `number`

***

### strokeColor?

> `optional` **strokeColor?**: `string`

Body stroke colour (`#rrggbb`).

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

***

### width?

> `optional` **width?**: `number`
