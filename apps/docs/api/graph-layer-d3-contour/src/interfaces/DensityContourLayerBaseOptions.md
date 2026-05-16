# Interface: DensityContourLayerBaseOptions

Defined in: [graph-layer-d3-contour/src/types.ts:11](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L11)

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

Defined in: [graph-layer-d3-contour/src/types.ts:23](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L23)

Kernel bandwidth in world units. Larger = smoother / broader blobs.
Defaults to `20` (d3's own default).

***

### cellSize?

> `optional` **cellSize?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:36](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L36)

Grid cell size in world units. Smaller = sharper bands but quadratically
more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph-layer-d3-contour/src/types.ts:17](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L17)

Required. Id of the `GraphLayer` whose node positions feed the density
estimate. Per canvas architecture: cross-layer deps are declared
explicitly, never inferred.

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:43](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L43)

Padding added around the node bounding box before building the grid, so
bands at the edge of the cluster aren't clipped against the grid border.
World units. Defaults to `50`.

***

### recompute?

> `optional` **recompute?**: `"auto"` \| `"manual"`

Defined in: [graph-layer-d3-contour/src/types.ts:51](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L51)

Recompute trigger:
- `'auto'` (default) — subscribe to the source layer's `data:changed`
  and recompute on a debounce.
- `'manual'` — caller drives recompute via `layer.recompute()`.

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:54](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L54)

Debounce window for `auto` recomputes. Default `120` ms.

***

### thresholds?

> `optional` **thresholds?**: `number` \| `number`[]

Defined in: [graph-layer-d3-contour/src/types.ts:30](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph-layer-d3-contour/src/types.ts#L30)

Either a count of iso-bands or an explicit array of iso-values. Defaults
to `10`. With a number, d3-contour picks evenly-spaced thresholds across
the value range.
