# Interface: ColorByFields

Flat form-field shape the `@invana/forms` generator renders.

Three encodings `FieldType` can't express directly:
- `fallbackColor` — the `0xRRGGBB` number as a `#rrggbb` hex string.
- `*Domain` — the `[min, max]` tuple split into two number fields, so either
  bound can be cleared independently (both blank = auto-scan).
- `*Thresholds` — the `number[]` as a comma-separated text field.

## Properties

### bins?

> `optional` **bins?**: `number`

***

### colorEdges?

> `optional` **colorEdges?**: `boolean`

***

### colorNodes?

> `optional` **colorNodes?**: `boolean`

***

### edgeDomainMax?

> `optional` **edgeDomainMax?**: `number`

***

### edgeDomainMin?

> `optional` **edgeDomainMin?**: `number`

***

### edgeThresholds?

> `optional` **edgeThresholds?**: `string`

Comma-separated bucket edges, e.g. `"10, 50, 200"`.

***

### edgeValueKey?

> `optional` **edgeValueKey?**: `string`

***

### fallbackColor?

> `optional` **fallbackColor?**: `string`

Fallback colour as a `#rrggbb` hex string.

***

### maxCategories?

> `optional` **maxCategories?**: `number`

***

### mode?

> `optional` **mode?**: [`ColorByModeValue`](../type-aliases/ColorByModeValue.md)

***

### nodeDomainMax?

> `optional` **nodeDomainMax?**: `number`

***

### nodeDomainMin?

> `optional` **nodeDomainMin?**: `number`

***

### nodeThresholds?

> `optional` **nodeThresholds?**: `string`

Comma-separated bucket edges, e.g. `"10, 50, 200"`.

***

### nodeValueKey?

> `optional` **nodeValueKey?**: `string`

***

### scale?

> `optional` **scale?**: [`ColorByScaleValue`](../type-aliases/ColorByScaleValue.md)
