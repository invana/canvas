# Interface: DensityContourPaletteOptions

The palette-resolution chain shared by both layers. The fill layer
consumes it to colour bands; the stroke layer consumes it when
`strokeColor: 'palette'`. Resolution order (most specific wins):
`fillColor` callback (fill layer only) > `paletteFn(t)` >
`paletteRangeStart`/`paletteRangeEnd` (only when BOTH set) > `palette`
(name or stop array) > default `'blues'`.

## Extended by

- [`DensityContourFillLayerOptions`](DensityContourFillLayerOptions.md)
- [`DensityContourStrokeLayerOptions`](DensityContourStrokeLayerOptions.md)

## Properties

### palette?

> `optional` **palette?**: `number`[] \| [`DensityContourPaletteName`](../type-aliases/DensityContourPaletteName.md)

***

### paletteFn?

> `optional` **paletteFn?**: (`t`) => `number`

#### Parameters

##### t

`number`

#### Returns

`number`

***

### paletteRangeEnd?

> `optional` **paletteRangeEnd?**: `number`

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`
