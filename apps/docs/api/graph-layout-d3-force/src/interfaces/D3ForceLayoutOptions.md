# Interface: D3ForceLayoutOptions

`D3ForceLayout` options. Every field maps 1:1 to a d3-force setter
documented at https://d3js.org/d3-force.

**All options default to `undefined`.** A force is only added to the
simulation when its option is provided. A setter is only called when
its sub-option is provided. Anything omitted falls through to
d3-force's own defaults — or, for forces themselves, is not added at
all.

## Example

```ts
new D3ForceLayout({
  charge: {},                       // adds forceManyBody at d3 defaults
  link: { distance: 80 },           // adds forceLink, override distance
  center: { x: 0, y: 0 },           // adds forceCenter at (0, 0)
  // no `collide` → no collision force
  // no `alphaDecay` → d3 default decay rate
});
```

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

When `true` (default), positions are written back to the store on
every d3-force tick — the renderer animates the simulation as it
settles.

When `false`, per-tick writeback is suppressed and positions are
flushed to the store exactly once when the simulation settles
(`sim.on('end')`). The simulation still runs to completion; only the
mirrored renderer updates are skipped. For large graphs (thousands
of nodes / tens of thousands of edges) this avoids the ~hundreds of
intermediate `setPositionsBulk` → `node:update` → renderer storms
that dominate cost — the run finishes noticeably faster and the
viewer just sees the settled picture appear.

Lifecycle `tick` events are still emitted in both modes — only the
store writeback is gated.

Default `true`.

***

### center?

> `optional` **center?**: [`CenterForceOptions`](CenterForceOptions.md)

`forceCenter` — translates the graph's centroid to `(x, y)`. When omitted
**and** no other positional anchor (`x`/`y`/`radial`) is set, the layout
defaults to a `forceCenter` at the origin so the simulation can't drift
off-axis; set this (or `x`/`y`/`radial`) to override that default anchor.

***

### charge?

> `optional` **charge?**: [`ChargeForceOptions`](ChargeForceOptions.md)

`forceManyBody` — n-body charge (negative = repulsion).

***

### cluster?

> `optional` **cluster?**: `object`

Keep `parentId` **group** members together — a lightweight clustering force
that, each tick, pulls every node in a group (and the group container node)
toward that group's centroid. Cheap (`O(N)` per tick) and complementary to
the other forces: it stops group members scattering across the graph, so an
`autoFit` group frame stays compact instead of ballooning.

Omit to disable (default). `strength` is the per-tick pull fraction toward
the centroid, alpha-scaled like d3's own forces (default `0.2`; higher =
tighter clusters). Not a container layout — for true nested boxes use ELK.

#### strength?

> `optional` **strength?**: `number`

***

### collide?

> `optional` **collide?**: [`CollideForceOptions`](CollideForceOptions.md)

`forceCollide` — prevents overlap.

***

### includeHidden?

> `optional` **includeHidden?**: `boolean`

Include explicitly-hidden nodes in the simulation. Default `false` — hidden
nodes (and links touching them) are excluded so they don't perturb the
force field, and their last positions stay frozen (never written back).

***

### link?

> `optional` **link?**: [`LinkForceOptions`](LinkForceOptions.md)

`forceLink` — pulls connected nodes toward a target distance.

***

### radial?

> `optional` **radial?**: [`RadialForceOptions`](RadialForceOptions.md)

`forceRadial` — pulls toward a circle of given radius. Requires `radius`.

***

### reheatAlpha?

> `optional` **reheatAlpha?**: `number`

Only with `animate: false`. Alpha the simulation reheats to when a run
starts from a graph that **already has settled positions** (i.e. an
incremental streaming add: most nodes are positioned, a few are new).
A low value keeps the existing layout stable — placed nodes barely move
while new nodes settle in — instead of yanking the whole graph through a
full `alpha = 1` re-layout on every chunk. The first run (no positioned
nodes) ignores this and uses [alpha](#alpha) (or d3's default of `1`).
Default `0.5`.

***

### velocityDecay?

> `optional` **velocityDecay?**: `number`

`simulation.velocityDecay(decay)`.

***

### workerFactory?

> `optional` **workerFactory?**: () => `Worker`

Only with `animate: false`. Factory for the Web Worker that runs the
static settle off the main thread (so a multi-hundred-tick convergence
doesn't block paint / input). Defaults to loading this package's bundled
solver worker. When no `Worker` global exists (Node / SSR / tests) or the
factory throws, the layout falls back to solving synchronously on the main
thread — correct, but blocking. Mirror of `ElkLayout`'s `workerFactory`.

#### Returns

`Worker`

***

### x?

> `optional` **x?**: [`PositionXForceOptions`](PositionXForceOptions.md)

`forceX` — positioning force along x.

***

### y?

> `optional` **y?**: [`PositionYForceOptions`](PositionYForceOptions.md)

`forceY` — positioning force along y.
