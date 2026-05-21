# Interface: D3ForceLayoutOptions

Defined in: [graph-layout-d3-force/src/types.ts:22](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L22)

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

Defined in: [graph-layout-d3-force/src/types.ts:47](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L47)

`simulation.alpha(alpha)`.

***

### alphaDecay?

> `optional` **alphaDecay?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:51](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L51)

`simulation.alphaDecay(decay)`.

***

### alphaMin?

> `optional` **alphaMin?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:49](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L49)

`simulation.alphaMin(min)`.

***

### alphaTarget?

> `optional` **alphaTarget?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:53](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L53)

`simulation.alphaTarget(target)`.

***

### animate?

> `optional` **animate?**: `boolean`

Defined in: [graph-layout-d3-force/src/types.ts:43](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L43)

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

Defined in: [graph-layout-d3-force/src/types.ts:63](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L63)

`forceCenter` — translates the cluster's centroid to `(x, y)`.

***

### charge?

> `optional` **charge?**: [`ChargeForceOptions`](ChargeForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:61](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L61)

`forceManyBody` — n-body charge (negative = repulsion).

***

### collide?

> `optional` **collide?**: [`CollideForceOptions`](CollideForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:65](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L65)

`forceCollide` — prevents overlap.

***

### link?

> `optional` **link?**: [`LinkForceOptions`](LinkForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:59](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L59)

`forceLink` — pulls connected nodes toward a target distance.

***

### radial?

> `optional` **radial?**: [`RadialForceOptions`](RadialForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:71](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L71)

`forceRadial` — pulls toward a circle of given radius. Requires `radius`.

***

### velocityDecay?

> `optional` **velocityDecay?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:55](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L55)

`simulation.velocityDecay(decay)`.

***

### x?

> `optional` **x?**: [`PositionXForceOptions`](PositionXForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:67](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L67)

`forceX` — positioning force along x.

***

### y?

> `optional` **y?**: [`PositionYForceOptions`](PositionYForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:69](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph-layout-d3-force/src/types.ts#L69)

`forceY` — positioning force along y.
