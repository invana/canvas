# Interface: DensityContourStrokeLayerFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`strokeColor: number | 'palette'` union is split into a `strokePalette`
boolean toggle plus a `strokeColor` colour string (see `mapping.ts`), because
a single field can't be both a swatch and a mode.

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

***

### cellSize?

> `optional` **cellSize?**: `number`

***

### indexEvery?

> `optional` **indexEvery?**: `number`

***

### indexMajorWidth?

> `optional` **indexMajorWidth?**: `number`

***

### indexMinorWidth?

> `optional` **indexMinorWidth?**: `number`

***

### padding?

> `optional` **padding?**: `number`

***

### palette?

> `optional` **palette?**: `DensityContourPaletteName`

***

### paletteRangeEnd?

> `optional` **paletteRangeEnd?**: `number`

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`

***

### recompute?

> `optional` **recompute?**: `DensityContourRecompute`

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

***

### strokeColor?

> `optional` **strokeColor?**: `string`

Constant iso-line colour `#rrggbb`, used only when [strokePalette](#strokepalette) is off.

***

### strokePalette?

> `optional` **strokePalette?**: `boolean`

Whether the iso-lines are coloured from the palette (vs a constant swatch).

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

***

### thresholds?

> `optional` **thresholds?**: `number`
