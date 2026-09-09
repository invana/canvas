# Interface: RippleConnectorDecorationStyle

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

***

### innerAlpha?

> `readonly` `optional` **innerAlpha?**: `number`

Initial (full-brightness) alpha at radius 0. Default `0.7`.

***

### maxRadius?

> `readonly` `optional` **maxRadius?**: `number`

Peak halo extent in px (half-width). Each ring's stroke widens from
`0` to `2 × maxRadius` over one period, so the silhouette appears to
push outward by up to `maxRadius` on each side. Default `16`.

***

### periodMs?

> `readonly` `optional` **periodMs?**: `number`

Cycle length in ms. Default `1400`.

***

### rings?

> `readonly` `optional` **rings?**: `number`

Number of concurrent rings (phase-distributed). Default `2`.
