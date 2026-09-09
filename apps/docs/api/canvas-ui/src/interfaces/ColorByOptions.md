# Interface: ColorByOptions

The serialisable subset of `ColorByBehaviourOptions` this editor produces.

Out of scope: the `nodeValueBy` / `edgeValueBy` **accessor callbacks** (they're
functions — not editable, not persistable) and the base `targetLayerId` /
`enabled` / `shortcuts`. Also omitted: `palette` (`number[]`) and
`valueColors` (`Record<string, number>`) — `FieldType` has no array or map
kind, so a swatch-array / value-swatch-pair editor is future work.

Colours are engine `0xRRGGBB` **numbers** here; the form carries `#rrggbb`
strings (see [ColorByFields](ColorByFields.md)).

## Properties

### bins?

> `optional` **bins?**: `number`

Bucket count for `scale: 'quantile'`.

***

### colorEdges?

> `optional` **colorEdges?**: `boolean`

***

### colorNodes?

> `optional` **colorNodes?**: `boolean`

***

### edgeDomain?

> `optional` **edgeDomain?**: readonly \[`number`, `number`\]

Explicit `[min, max]` for edge values; omit for auto-scan.

***

### edgeThresholds?

> `optional` **edgeThresholds?**: readonly `number`[]

Explicit bucket edges for `scale: 'threshold'`, edge units.

***

### edgeValueKey?

> `optional` **edgeValueKey?**: `string`

Root-relative dot path driving edge colour.

***

### fallbackColor?

> `optional` **fallbackColor?**: `number`

Colour for missing / non-numeric values, as an engine `0xRRGGBB` number.

***

### maxCategories?

> `optional` **maxCategories?**: `number`

Cardinality cap for `'categorical'`.

***

### mode?

> `optional` **mode?**: [`ColorByModeValue`](../type-aliases/ColorByModeValue.md)

***

### nodeDomain?

> `optional` **nodeDomain?**: readonly \[`number`, `number`\]

Explicit `[min, max]` for node values; omit for auto-scan.

***

### nodeThresholds?

> `optional` **nodeThresholds?**: readonly `number`[]

Explicit bucket edges for `scale: 'threshold'`, node units.

***

### nodeValueKey?

> `optional` **nodeValueKey?**: `string`

Root-relative dot path driving node colour — `'type'`, `'data.riskScore'`.

***

### scale?

> `optional` **scale?**: [`ColorByScaleValue`](../type-aliases/ColorByScaleValue.md)
