# Interface: DensityContourStrokeLayerOptions

Defined in: [graph-layer-d3-contour/src/types.ts:100](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L100)

Options for [DensityContourStrokeLayer](../classes/DensityContourStrokeLayer.md). Paints iso-line outlines
and nothing else — no fill. Defaults match Observable's
[`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
steelblue strokes, every 5th band stroked at 1 unit, the rest at 0.25
(the topographic "index contour" pattern).

## Extends

- [`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md)

## Properties

### bandwidth?

> `optional` **bandwidth?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:23](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L23)

Kernel bandwidth in world units. Larger = smoother / broader blobs.
Defaults to `20` (d3's own default).

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`bandwidth`](DensityContourLayerBaseOptions.md#bandwidth)

***

### cellSize?

> `optional` **cellSize?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:36](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L36)

Grid cell size in world units. Smaller = sharper bands but quadratically
more compute. d3 requires a power of two (1, 2, 4, 8, 16). Defaults to `4`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`cellSize`](DensityContourLayerBaseOptions.md#cellsize)

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph-layer-d3-contour/src/types.ts:17](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L17)

Required. Id of the `GraphLayer` whose node positions feed the density
estimate. Per canvas architecture: cross-layer deps are declared
explicitly, never inferred.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`graphLayerId`](DensityContourLayerBaseOptions.md#graphlayerid)

***

### indexEvery?

> `optional` **indexEvery?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:142](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L142)

Index-contour sugar — every `indexEvery`-th band (counting from
low-density at `i=0`) is stroked with [indexMajorWidth](#indexmajorwidth), all
others with [indexMinorWidth](#indexminorwidth). Reproduces the topographic
"index contour every N lines" pattern used by Observable's
`@d3/density-contours`.

Precedence: function-form [strokeWidth](#strokewidth) wins over the sugar (so
callers can opt fully out by setting `strokeWidth` to a callback). The
sugar wins over numeric [strokeWidth](#strokewidth). All three sugar fields
must be set together; partial setups fall back to [strokeWidth](#strokewidth).

Defaults reproduce Observable's example: `indexEvery: 5`,
`indexMajorWidth: 1`, `indexMinorWidth: 0.25`.

***

### indexMajorWidth?

> `optional` **indexMajorWidth?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:143](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L143)

***

### indexMinorWidth?

> `optional` **indexMinorWidth?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:144](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L144)

***

### padding?

> `optional` **padding?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:43](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L43)

Padding added around the node bounding box before building the grid, so
bands at the edge of the cluster aren't clipped against the grid border.
World units. Defaults to `50`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`padding`](DensityContourLayerBaseOptions.md#padding)

***

### palette?

> `optional` **palette?**: `number`[] \| [`DensityContourPaletteName`](../type-aliases/DensityContourPaletteName.md)

Defined in: [graph-layer-d3-contour/src/types.ts:66](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L66)

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`palette`](DensityContourPaletteOptions.md#palette)

***

### paletteFn?

> `optional` **paletteFn?**: (`t`) => `number`

Defined in: [graph-layer-d3-contour/src/types.ts:69](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L69)

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

Defined in: [graph-layer-d3-contour/src/types.ts:68](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L68)

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`paletteRangeEnd`](DensityContourPaletteOptions.md#paletterangeend)

***

### paletteRangeStart?

> `optional` **paletteRangeStart?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:67](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L67)

#### Inherited from

[`DensityContourPaletteOptions`](DensityContourPaletteOptions.md).[`paletteRangeStart`](DensityContourPaletteOptions.md#paletterangestart)

***

### recompute?

> `optional` **recompute?**: `"auto"` \| `"manual"`

Defined in: [graph-layer-d3-contour/src/types.ts:51](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L51)

Recompute trigger:
- `'auto'` (default) — subscribe to the source layer's `data:changed`
  and recompute on a debounce.
- `'manual'` — caller drives recompute via `layer.recompute()`.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`recompute`](DensityContourLayerBaseOptions.md#recompute)

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Defined in: [graph-layer-d3-contour/src/types.ts:54](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L54)

Debounce window for `auto` recomputes. Default `120` ms.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`recomputeDebounceMs`](DensityContourLayerBaseOptions.md#recomputedebouncems)

***

### strokeColor?

> `optional` **strokeColor?**: `number` \| `"palette"`

Defined in: [graph-layer-d3-contour/src/types.ts:112](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L112)

Band outline colour.

- `0xRRGGBB` → constant colour for every band. Default `0x4682b4`
  (steelblue, Observable's default).
- `'palette'` → resolved per band through the palette chain above
  ([paletteFn](DensityContourPaletteOptions.md#palettefn) > range > [palette](DensityContourPaletteOptions.md#palette)). Use this for the
  "rainbow iso-lines" look.

***

### strokeWidth?

> `optional` **strokeWidth?**: `number` \| ((`index`, `total`, `value`) => `number`)

Defined in: [graph-layer-d3-contour/src/types.ts:125](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L125)

Band outline width. Either a constant or a per-band function that
receives `(index, total, value)` and returns a width in world units.

The function form is the most general — useful for any pattern where
width depends on `index`. For the canonical topo-map "every Nth line
heavy" look, prefer the declarative [indexEvery](#indexevery)/
[indexMajorWidth](#indexmajorwidth)/[indexMinorWidth](#indexminorwidth) sugar below.

Default `0.5`.

***

### thresholds?

> `optional` **thresholds?**: `number` \| `number`[]

Defined in: [graph-layer-d3-contour/src/types.ts:30](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layer-d3-contour/src/types.ts#L30)

Either a count of iso-bands or an explicit array of iso-values. Defaults
to `10`. With a number, d3-contour picks evenly-spaced thresholds across
the value range.

#### Inherited from

[`DensityContourLayerBaseOptions`](DensityContourLayerBaseOptions.md).[`thresholds`](DensityContourLayerBaseOptions.md#thresholds)
