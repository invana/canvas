# Interface: D3ForceLayoutOptions

Defined in: [graph-layout-d3-force/src/types.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L22)

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

Defined in: [graph-layout-d3-force/src/types.ts:69](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L69)

`simulation.alpha(alpha)`.

***

### alphaDecay?

> `optional` **alphaDecay?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:73](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L73)

`simulation.alphaDecay(decay)`.

***

### alphaMin?

> `optional` **alphaMin?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:71](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L71)

`simulation.alphaMin(min)`.

***

### alphaTarget?

> `optional` **alphaTarget?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L75)

`simulation.alphaTarget(target)`.

***

### animate?

> `optional` **animate?**: `boolean`

Defined in: [graph-layout-d3-force/src/types.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L43)

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

Defined in: [graph-layout-d3-force/src/types.ts:85](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L85)

`forceCenter` — translates the cluster's centroid to `(x, y)`.

***

### charge?

> `optional` **charge?**: [`ChargeForceOptions`](ChargeForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L83)

`forceManyBody` — n-body charge (negative = repulsion).

***

### collide?

> `optional` **collide?**: [`CollideForceOptions`](CollideForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L87)

`forceCollide` — prevents overlap.

***

### link?

> `optional` **link?**: [`LinkForceOptions`](LinkForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:81](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L81)

`forceLink` — pulls connected nodes toward a target distance.

***

### radial?

> `optional` **radial?**: [`RadialForceOptions`](RadialForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:93](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L93)

`forceRadial` — pulls toward a circle of given radius. Requires `radius`.

***

### reheatAlpha?

> `optional` **reheatAlpha?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:55](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L55)

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

Defined in: [graph-layout-d3-force/src/types.ts:77](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L77)

`simulation.velocityDecay(decay)`.

***

### workerFactory?

> `optional` **workerFactory?**: () => `Worker`

Defined in: [graph-layout-d3-force/src/types.ts:65](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L65)

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

Defined in: [graph-layout-d3-force/src/types.ts:89](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L89)

`forceX` — positioning force along x.

***

### y?

> `optional` **y?**: [`PositionYForceOptions`](PositionYForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:91](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layout-d3-force/src/types.ts#L91)

`forceY` — positioning force along y.
