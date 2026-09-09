# Interface: DensityContourStrokeLayerOptions

The subset of `DensityContourStrokeLayerOptions` this editor produces — a
serialisable patch. The `graphLayerId` cross-layer identity and the
`paletteFn` callback are out of scope. `strokeColor` keeps the engine's
`number (0xRRGGBB) | 'palette'` encoding (a constant colour or per-band
palette resolution); `strokeWidth` keeps only its scalar constant form (the
per-band width callback is out of scope). `thresholds` keeps only the scalar
band-count form.

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

Kernel bandwidth in world units. Larger = smoother / broader blobs.

***

### cellSize?

> `optional` **cellSize?**: `number`

Grid cell size in world units (d3 requires a power of two).

***

### indexEvery?

> `optional` **indexEvery?**: `number`

Index-contour sugar — every Nth band is stroked with the major width.

***

### indexMajorWidth?

> `optional` **indexMajorWidth?**: `number`

Width of the "major" (index) contours.

***

### indexMinorWidth?

> `optional` **indexMinorWidth?**: `number`

Width of the "minor" (in-between) contours.

***

### padding?

> `optional` **padding?**: `number`

Padding around the node bounding box before building the grid.

***

### palette?

> `optional` **palette?**: `DensityContourPaletteName`

Named colour ramp — consulted when `strokeColor === 'palette'`.

***

### paletteRangeEnd?

> `optional` **paletteRangeEnd?**: `number`

Palette end fraction 0..1 (used only when both start + end set).

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`

Palette start fraction 0..1 (used only when both start + end set).

***

### recompute?

> `optional` **recompute?**: `DensityContourRecompute`

Recompute trigger.

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Debounce window for `auto` recomputes, in ms.

***

### strokeColor?

> `optional` **strokeColor?**: `number` \| `"palette"`

Iso-line colour: a constant `0xRRGGBB` integer, or `'palette'` to resolve
per band through the palette chain.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number`

Constant iso-line width in world units.

***

### thresholds?

> `optional` **thresholds?**: `number`

Band count (scalar `thresholds` form).
