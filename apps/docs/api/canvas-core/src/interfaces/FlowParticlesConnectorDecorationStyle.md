# Interface: FlowParticlesConnectorDecorationStyle

Connector decoration that animates `count` markers travelling along the
routed path at the same speed, evenly spread in phase. Useful for
visualising sustained flow / throughput on an edge (e.g. data streaming,
traffic).

Same engine as `FlyMarkerConnectorDecoration` extended to N markers; one
arc-length table is built per repaint and shared across all particles.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

***

### count?

> `readonly` `optional` **count?**: `number`

Number of particles. Clamped to `>= 1`. Default `5`.

***

### loop?

> `readonly` `optional` **loop?**: `boolean`

When `true` (default) particles wrap back to the start after reaching
the end. Setting this to `false` makes all particles stall at the end
once they arrive — usually only useful with `count: 1`.

***

### markerKind?

> `readonly` `optional` **markerKind?**: `"square"` \| `"circle"` \| `"arrow"`

Marker silhouette. Default `'circle'`.

***

### orientToPath?

> `readonly` `optional` **orientToPath?**: `boolean`

Rotate each marker so its local +x axis points along the local tangent.
Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.

***

### phase?

> `readonly` `optional` **phase?**: `number`

Phase offset applied to every particle in `[0, 1]`. Default `0`.

***

### size?

> `readonly` `optional` **size?**: `number`

Marker size in px. Default `6`.

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Travel speed along the path in px/sec. Negative values reverse direction.
Default `60`.
