# Interface: CollideForceOptions

Defined in: [graph-layout-d3-force/src/types.ts:129](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L129)

`forceCollide` configuration.

## Properties

### iterations?

> `optional` **iterations?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:140](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L140)

`collide.iterations(n)`.

***

### radius?

> `optional` **radius?**: `number` \| ((`node`) => `number`)

Defined in: [graph-layout-d3-force/src/types.ts:136](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L136)

`collide.radius(r)`. Either a constant, or a per-node function called
once per node at `apply()` time with the underlying `GraphNode`. Use
the function form when collision sizes vary per node (e.g. read
`node.data.size`).

***

### strength?

> `optional` **strength?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:138](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L138)

`collide.strength(s)` in `[0, 1]`.
