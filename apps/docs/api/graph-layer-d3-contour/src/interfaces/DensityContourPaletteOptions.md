# Interface: DensityContourPaletteOptions

Defined in: [graph-layer-d3-contour/src/types.ts:65](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/types.ts#L65)

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

Defined in: [graph-layer-d3-contour/src/types.ts:66](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/types.ts#L66)

***

### paletteFn?

> `optional` **paletteFn?**: (`t`) => `number`

Defined in: [graph-layer-d3-contour/src/types.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/types.ts#L69)

#### Parameters

##### t

`number`

#### Returns

`number`

***

### paletteRangeEnd?

> `optional` **paletteRangeEnd?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:68](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/types.ts#L68)

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:67](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layer-d3-contour/src/types.ts#L67)
