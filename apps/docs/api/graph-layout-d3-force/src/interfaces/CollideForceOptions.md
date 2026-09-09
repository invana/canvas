# Interface: CollideForceOptions

`forceCollide` configuration.

## Properties

### iterations?

> `optional` **iterations?**: `number`

`collide.iterations(n)`.

***

### radius?

> `optional` **radius?**: `number` \| ((`node`) => `number`)

`collide.radius(r)`. A constant, or a per-node function called once per node
at `apply()` time with the underlying `GraphNode`.

**Unset (default):** the radius is derived from each node's cached render
bounds — `max(boundingBox.width, boundingBox.height) / 2` — so nodes
(including wide composite cards) don't overlap without hand-tuning. Pass a
number / function to override (e.g. read `node.data.size`).

***

### strength?

> `optional` **strength?**: `number`

`collide.strength(s)` in `[0, 1]`.
