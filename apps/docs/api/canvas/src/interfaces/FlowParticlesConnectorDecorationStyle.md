# Interface: FlowParticlesConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:15](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L15)

Connector decoration that animates `count` markers travelling along the
routed path at the same speed, evenly spread in phase. Useful for
visualising sustained flow / throughput on an edge (e.g. data streaming,
traffic).

Same engine as `FlyMarkerConnectorDecoration` extended to N markers; one
arc-length table is built per repaint and shared across all particles.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:42](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L42)

Overall decoration alpha. Default `1`.

***

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:16](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L16)

***

### count?

> `readonly` `optional` **count?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:20](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L20)

Number of particles. Clamped to `>= 1`. Default `5`.

***

### loop?

> `readonly` `optional` **loop?**: `boolean`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:33](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L33)

When `true` (default) particles wrap back to the start after reaching
the end. Setting this to `false` makes all particles stall at the end
once they arrive — usually only useful with `count: 1`.

***

### markerKind?

> `readonly` `optional` **markerKind?**: `"circle"` \| `"arrow"` \| `"square"`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:18](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L18)

Marker silhouette. Default `'circle'`.

***

### orientToPath?

> `readonly` `optional` **orientToPath?**: `boolean`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:40](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L40)

Rotate each marker so its local +x axis points along the local tangent.
Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.

***

### phase?

> `readonly` `optional` **phase?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:35](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L35)

Phase offset applied to every particle in `[0, 1]`. Default `0`.

***

### size?

> `readonly` `optional` **size?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:22](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L22)

Marker size in px. Default `6`.

***

### speedPxPerSec?

> `readonly` `optional` **speedPxPerSec?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts:27](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/decorations/connector/FlowParticlesConnectorDecoration.ts#L27)

Travel speed along the path in px/sec. Negative values reverse direction.
Default `60`.
