# Interface: DensityContourFillLayerOptions

The subset of `DensityContourFillLayerOptions` this editor produces — a
serialisable patch. The `graphLayerId` cross-layer identity, the `fillColor`
per-band callback, and the `paletteFn` callback are out of scope (identity /
function options). `thresholds` keeps only the scalar band-count form; the
explicit iso-value array is out of scope.

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

Kernel bandwidth in world units. Larger = smoother / broader blobs.

***

### cellSize?

> `optional` **cellSize?**: `number`

Grid cell size in world units (d3 requires a power of two).

***

### fillOpacity?

> `optional` **fillOpacity?**: `number`

Fill alpha 0..1. Default `0.4`.

***

### padding?

> `optional` **padding?**: `number`

Padding around the node bounding box before building the grid.

***

### palette?

> `optional` **palette?**: `DensityContourPaletteName`

Named colour ramp for the bands.

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

### thresholds?

> `optional` **thresholds?**: `number`

Band count (scalar `thresholds` form).
