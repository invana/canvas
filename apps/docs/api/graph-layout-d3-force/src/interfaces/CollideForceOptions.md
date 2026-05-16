# Interface: CollideForceOptions

Defined in: [graph-layout-d3-force/src/types.ts:85](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-force/src/types.ts#L85)

`forceCollide` configuration.

## Properties

### iterations?

> `optional` **iterations?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:96](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-force/src/types.ts#L96)

`collide.iterations(n)`.

***

### radius?

> `optional` **radius?**: `number` \| ((`node`) => `number`)

Defined in: [graph-layout-d3-force/src/types.ts:92](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-force/src/types.ts#L92)

`collide.radius(r)`. Either a constant, or a per-node function called
once per node at `apply()` time with the underlying `GraphNode`. Use
the function form when collision sizes vary per node (e.g. read
`node.data.size`).

***

### strength?

> `optional` **strength?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:94](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph-layout-d3-force/src/types.ts#L94)

`collide.strength(s)` in `[0, 1]`.
