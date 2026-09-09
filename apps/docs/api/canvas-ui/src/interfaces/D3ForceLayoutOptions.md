# Interface: D3ForceLayoutOptions

The subset of `D3ForceLayoutOptions` this editor produces — a serialisable
patch. The forces d3-force nests under `link` / `charge` / `center` /
`collide` are kept nested here (the editor flattens them into prefixed scalar
fields, see [D3ForceLayoutFields](D3ForceLayoutFields.md)). Function options (`collide.radius`
as a function, `workerFactory`), the `x` / `y` / `radial` positioning forces,
and registry wiring (`id` / `targetLayerId`) are out of scope; the tunable
scalars round-trip.

## Properties

### alpha?

> `optional` **alpha?**: `number`

`simulation.alpha(alpha)`.

***

### alphaDecay?

> `optional` **alphaDecay?**: `number`

`simulation.alphaDecay(decay)`.

***

### alphaMin?

> `optional` **alphaMin?**: `number`

`simulation.alphaMin(min)`.

***

### alphaTarget?

> `optional` **alphaTarget?**: `number`

`simulation.alphaTarget(target)`.

***

### animate?

> `optional` **animate?**: `boolean`

Write positions every tick (live animation) vs. flush once on settle.

***

### center?

> `optional` **center?**: `object`

`forceCenter` — translates the cluster's centroid to `(x, y)`.

#### strength?

> `optional` **strength?**: `number`

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### charge?

> `optional` **charge?**: `object`

`forceManyBody` — n-body charge (negative = repulsion).

#### distanceMax?

> `optional` **distanceMax?**: `number`

#### distanceMin?

> `optional` **distanceMin?**: `number`

#### strength?

> `optional` **strength?**: `number`

#### theta?

> `optional` **theta?**: `number`

***

### cluster?

> `optional` **cluster?**: `object`

Group-clustering pull — keeps `parentId` group members together.

#### strength?

> `optional` **strength?**: `number`

***

### collide?

> `optional` **collide?**: `object`

`forceCollide` — prevents overlap. Only the constant `radius` is editable.

#### iterations?

> `optional` **iterations?**: `number`

#### radius?

> `optional` **radius?**: `number`

#### strength?

> `optional` **strength?**: `number`

***

### link?

> `optional` **link?**: `object`

`forceLink` — pulls connected nodes toward a target distance.

#### distance?

> `optional` **distance?**: `number`

#### iterations?

> `optional` **iterations?**: `number`

#### strength?

> `optional` **strength?**: `number`

***

### reheatAlpha?

> `optional` **reheatAlpha?**: `number`

Reheat alpha for incremental streaming adds (only with `animate: false`).

***

### velocityDecay?

> `optional` **velocityDecay?**: `number`

`simulation.velocityDecay(decay)`.
