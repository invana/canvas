# Interface: LassoSelectFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`enableElements: ('shape'|'connector')[]` array is split into two booleans;
`trigger: LassoModifierKey[]` collapses to a single select (`'none'` = no
gate); the nested `style` group is flattened to `style`-prefixed scalars
(see `mapping.ts`).

## Properties

### clearOnBackground?

> `optional` **clearOnBackground?**: `boolean`

***

### enableConnectors?

> `optional` **enableConnectors?**: `boolean`

Whether edges are eligible for lasso selection. Maps to `enableElements` including `'connector'`.

***

### enableShapes?

> `optional` **enableShapes?**: `boolean`

Whether nodes are eligible for lasso selection. Maps to `enableElements` including `'shape'`.

***

### immediately?

> `optional` **immediately?**: `boolean`

***

### state?

> `optional` **state?**: `string`

***

### styleFill?

> `optional` **styleFill?**: `string`

***

### styleFillAlpha?

> `optional` **styleFillAlpha?**: `number`

***

### styleStroke?

> `optional` **styleStroke?**: `string`

***

### styleStrokeAlpha?

> `optional` **styleStrokeAlpha?**: `number`

***

### styleStrokeWidth?

> `optional` **styleStrokeWidth?**: `number`

***

### trigger?

> `optional` **trigger?**: `"none"` \| `LassoSelectModifierKey`

Single modifier gate. `'none'` maps to the engine's empty `trigger` array.
