# Interface: RippleConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L18)

Connector analogue of `PulseRingDecoration`. Each frame, every ring
strokes the host's body + markers at a width that grows outward over
one period and fades as it grows — so the wave inherits the connector's
silhouette (line shape, bends, arrowhead) instead of being a circular
pulse at a single point. Multiple concurrent rings are phase-
distributed across one period for a steady rhythm.

Geometry is delegated to `connector.paintInto` with a widening
`strokeWidth` and `tintMarkers + markerHalo` (so the markers outline at
the ring's width, not scale up). The host's normal paint sits on top
(zIndex = 0; this decoration's slot z is typically < 0 for "behind"
rings, ≥ 0 for "above" rings — pick a slot name accordingly).

## Properties

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:19](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L19)

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:31](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L31)

Initial (full-brightness) alpha at radius 0. Default `0.7`.

***

### maxRadius?

> `readonly` `optional` **maxRadius?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:25](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L25)

Peak halo extent in px (half-width). Each ring's stroke widens from
`0` to `2 × maxRadius` over one period, so the silhouette appears to
push outward by up to `maxRadius` on each side. Default `16`.

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:27](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L27)

Cycle length in ms. Default `1400`.

***

### rings?

> `readonly` `optional` **rings?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts:29](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/RippleConnectorDecoration.ts#L29)

Number of concurrent rings (phase-distributed). Default `2`.
