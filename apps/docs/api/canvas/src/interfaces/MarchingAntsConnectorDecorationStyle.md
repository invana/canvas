# Interface: MarchingAntsConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:16](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L16)

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

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:30](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L30)

Overall decoration alpha. Default `1`.

***

### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:31](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L31)

***

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:17](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L17)

***

### dashLength?

> `readonly` `optional` **dashLength?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:21](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L21)

Dash length in px. Default `6`.

***

### gapLength?

> `readonly` `optional` **gapLength?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:23](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L23)

Gap length in px. Default `4`.

***

### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:32](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L32)

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:28](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L28)

March speed in px/sec along the path. Default `24`.
Negative values reverse the march direction.

***

### strokeWidth?

> `readonly` `optional` **strokeWidth?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts:19](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts#L19)

Stroke width in px. Default `1.5`.
