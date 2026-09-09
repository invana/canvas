# Interface: MarchingAntsConnectorDecorationStyle

Connector variant of marching-ants. Strokes the connector's routed path
with a dashed line whose `dashOffset` advances each frame, producing
a flowing/marching pattern along the line — useful for highlighting an
active edge, a route under consideration, a data flow, etc.

Geometry is delegated to `host.connector.paintInto` with `dashArray` /
`dashOffset` overrides; the connector primitive samples the routed
path and emits dashes via the shared `dashedStroke` helper. Works on
every router / pathStyle (straight, orth, bezier, smooth — all produce
a `Path`).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Overall decoration alpha. Default `1`.

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

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

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

March speed in px/sec along the path. Default `24`.
Negative values reverse the march direction.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Stroke width in px. Default `1.5`.
