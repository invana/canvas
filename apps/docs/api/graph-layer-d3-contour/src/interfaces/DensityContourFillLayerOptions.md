# Interface: DensityContourFillLayerOptions

Options for [DensityContourFillLayer](../classes/DensityContourFillLayer.md). Paints filled iso-bands and
nothing else — no stroke. For an outline-only look use
[DensityContourStrokeLayer](../classes/DensityContourStrokeLayer.md); compose both layers (same
`graphLayerId`, different `zIndex`) for fill + outline together.

## Extends

- [`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md)

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

Kernel bandwidth in world units. Larger = smoother / broader blobs.
Defaults to `20` (d3's own default).

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`bandwidth`](DensityContourLayerBaseOptions.md#bandwidth)

***

### cellSize?

> `optional` **cellSize?**: `number`

Grid cell size in world units. Smaller = sharper bands but quadratically
more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`cellSize`](DensityContourLayerBaseOptions.md#cellsize)

***

### fillColor?

> `optional` **fillColor?**: (`value`, `index`, `total`) => `number`

Fully-custom fill colour per band. Receives `(value, index, total)` and
returns a `0xRRGGBB` integer. `value` is the iso-value (density);
`index` runs 0..total-1 from low-density to high-density. Wins over
every other palette option.

#### Parameters

##### value

`number`

##### index

`number`

##### total

`number`

#### Returns

`number`

***

### fillOpacity?

> `optional` **fillOpacity?**: `number`

Fill alpha 0..1. Defaults to `0.4`.

***

### graphLayerId

> **graphLayerId**: `string`

Required. Id of the `GraphLayer` whose node positions feed the density
estimate. Per canvas architecture: cross-layer deps are declared
explicitly, never inferred.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`graphLayerId`](DensityContourLayerBaseOptions.md#graphlayerid)

***

### padding?

> `optional` **padding?**: `number`

Padding added around the node bounding box before building the grid, so
bands at the edge of the cluster aren't clipped against the grid border.
World units. Defaults to `50`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`padding`](DensityContourLayerBaseOptions.md#padding)

***

### palette?

> `optional` **palette?**: `number`[] \| [`DensityContourPaletteName`](../type-aliases/DensityContourPaletteName.md)

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`palette`](DensityContourPaletteOptions.md#palette)

***

### paletteFn?

> `optional` **paletteFn?**: (`t`) => `number`

#### Parameters

##### t

`number`

#### Returns

`number`

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`paletteFn`](DensityContourPaletteOptions.md#palettefn)

***

### paletteRangeEnd?

> `optional` **paletteRangeEnd?**: `number`

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`paletteRangeEnd`](DensityContourPaletteOptions.md#paletterangeend)

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`paletteRangeStart`](DensityContourPaletteOptions.md#paletterangestart)

***

### recompute?

> `optional` **recompute?**: `"manual"` \| `"auto"`

Recompute trigger:
- `'auto'` (default) — subscribe to the source layer's `data:changed`
  and recompute on a debounce.
- `'manual'` — caller drives recompute via `layer.recompute()`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`recompute`](DensityContourLayerBaseOptions.md#recompute)

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Debounce window for `auto` recomputes. Default `120` ms.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`recomputeDebounceMs`](DensityContourLayerBaseOptions.md#recomputedebouncems)

***

### thresholds?

> `optional` **thresholds?**: `number` \| `number`[]

Either a count of iso-bands or an explicit array of iso-values. Defaults
to `10`. With a number, d3-contour picks evenly-spaced thresholds across
the value range.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`thresholds`](DensityContourLayerBaseOptions.md#thresholds)
