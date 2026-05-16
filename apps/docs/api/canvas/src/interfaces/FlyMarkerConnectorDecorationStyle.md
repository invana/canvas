# Interface: FlyMarkerConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:17](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L17)

Connector decoration that animates a single marker travelling along the
routed path of its host. Useful for visualising direction, data flow, or
an active "in-flight" state on an edge. Works on every router / pathStyle
because it consumes the resolved `Path` via `samplePath`.

The marker's silhouette is drawn once into `markerGfx`; only its position
and rotation are updated each frame. Position is derived from a
cumulative arc-length table rebuilt on `repaint` (host or style change),
so per-frame work is a binary search + interpolation.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:42](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L42)

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L18)

***

### loop?

> `readonly` `optional` **loop?**: `boolean`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:33](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L33)

When `true` (default) the marker wraps back to the start after reaching
the end (or vice versa for negative speed). When `false` the marker
stops at the end of the path until the decoration is removed.

***

### markerKind?

> `readonly` `optional` **markerKind?**: `"circle"` \| `"arrow"` \| `"square"`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:20](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L20)

Marker silhouette. Default `'circle'`.

***

### orientToPath?

> `readonly` `optional` **orientToPath?**: `boolean`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:40](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L40)

Rotate the marker so its local +x axis points along the local tangent.
Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.

***

### phase?

> `readonly` `optional` **phase?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:35](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L35)

Initial position along the path in `[0, 1]`. Default `0`.

***

### size?

> `readonly` `optional` **size?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:22](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L22)

Marker size in px (diameter / arrow length / square side). Default `8`.

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts:27](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlyMarkerConnectorDecoration.ts#L27)

Travel speed along the path in px/sec. Negative values reverse direction.
Default `80`.
