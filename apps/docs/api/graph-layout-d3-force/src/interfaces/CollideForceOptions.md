# Interface: CollideForceOptions

Defined in: [graph-layout-d3-force/src/types.ts:107](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L107)

`forceCollide` configuration.

## Properties

### iterations?

> `optional` **iterations?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:118](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L118)

`collide.iterations(n)`.

***

### radius?

> `optional` **radius?**: `number` \| ((`node`) => `number`)

Defined in: [graph-layout-d3-force/src/types.ts:114](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L114)

`collide.radius(r)`. Either a constant, or a per-node function called
once per node at `apply()` time with the underlying `GraphNode`. Use
the function form when collision sizes vary per node (e.g. read
`node.data.size`).

***

### strength?

> `optional` **strength?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:116](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L116)

`collide.strength(s)` in `[0, 1]`.
