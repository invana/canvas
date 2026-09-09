# Interface: FlyMarkerConnectorDecorationStyle

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

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

***

### loop?

> `readonly` `optional` **loop?**: `boolean`

When `true` (default) the marker wraps back to the start after reaching
the end (or vice versa for negative speed). When `false` the marker
stops at the end of the path until the decoration is removed.

***

### markerKind?

> `readonly` `optional` **markerKind?**: `"square"` \| `"circle"` \| `"arrow"`

Marker silhouette. Default `'circle'`.

***

### orientToPath?

> `readonly` `optional` **orientToPath?**: `boolean`

Rotate the marker so its local +x axis points along the local tangent.
Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.

***

### phase?

> `readonly` `optional` **phase?**: `number`

Initial position along the path in `[0, 1]`. Default `0`.

***

### size?

> `readonly` `optional` **size?**: `number`

Marker size in px (diameter / arrow length / square side). Default `8`.

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Travel speed along the path in px/sec. Negative values reverse direction.
Default `80`.
