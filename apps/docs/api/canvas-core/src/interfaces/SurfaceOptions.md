# Interface: SurfaceOptions

Per-layer knobs for the device a surface builds. These are *engine policy a
layer owns*, not device config — a graph layer with tiny nodes wants a larger
hit floor than a layer of big cards, and only the layer knows that.

## Properties

### hitFloorPx?

> `optional` **hitFloorPx?**: `number`

Minimum hover/click target in screen pixels, used as a fallback when no
silhouette contains the cursor. See `PrimitivesRendererOptions.hitFloorPx`.
