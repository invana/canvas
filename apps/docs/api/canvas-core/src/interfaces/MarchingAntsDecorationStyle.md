# Interface: MarchingAntsDecorationStyle

Classic "marching ants" selection outline. Strokes the host silhouette
with a dashed border whose `dashOffset` advances each frame, producing
the characteristic crawling-along-the-edge animation seen in selection
marquees (Photoshop, Figma, etc.).

Geometry is delegated to `host.shape.paintInto` with `dashArray` /
`dashOffset` overrides — the shape primitive itself does the
silhouette tessellation. Works on every shape that implements
`paintInto` (anything extending `ShapeBase`).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

***

### dashLength?

> `readonly` `optional` **dashLength?**: `number`

Dash length in px. Default `6`.

***

### gapLength?

> `readonly` `optional` **gapLength?**: `number`

Gap length in px. Default `4`.

***

### inset?

> `readonly` `optional` **inset?**: `number`

Distance from the host silhouette. Positive = inside, negative =
outside. Default `0` (on the silhouette itself).

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

March speed in px/sec along the perimeter. Default `24`.
Negative values reverse the march direction.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Stroke width in px. Default `1.5`.
