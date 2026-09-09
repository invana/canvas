# Interface: DensityContourLayerBaseOptions

Options shared by every `DensityContourLayer*` — the d3-contour compute
inputs and the recompute lifecycle. Both [DensityContourFillLayer](../classes/DensityContourFillLayer.md)
and [DensityContourStrokeLayer](../classes/DensityContourStrokeLayer.md) extend this; their layer-specific
presentation knobs live on their own options interfaces.

## Extended by

- [`DensityContourFillLayerOptions`](DensityContourFillLayerOptions.md)
- [`DensityContourStrokeLayerOptions`](DensityContourStrokeLayerOptions.md)

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

Kernel bandwidth in world units. Larger = smoother / broader blobs.
Defaults to `20` (d3's own default).

***

### cellSize?

> `optional` **cellSize?**: `number`

Grid cell size in world units. Smaller = sharper bands but quadratically
more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.

***

### graphLayerId

> **graphLayerId**: `string`

Required. Id of the `GraphLayer` whose node positions feed the density
estimate. Per canvas architecture: cross-layer deps are declared
explicitly, never inferred.

***

### padding?

> `optional` **padding?**: `number`

Padding added around the node bounding box before building the grid, so
bands at the edge of the cluster aren't clipped against the grid border.
World units. Defaults to `50`.

***

### recompute?

> `optional` **recompute?**: `"manual"` \| `"auto"`

Recompute trigger:
- `'auto'` (default) — subscribe to the source layer's `data:changed`
  and recompute on a debounce.
- `'manual'` — caller drives recompute via `layer.recompute()`.

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Debounce window for `auto` recomputes. Default `120` ms.

***

### thresholds?

> `optional` **thresholds?**: `number` \| `number`[]

Either a count of iso-bands or an explicit array of iso-values. Defaults
to `10`. With a number, d3-contour picks evenly-spaced thresholds across
the value range.
