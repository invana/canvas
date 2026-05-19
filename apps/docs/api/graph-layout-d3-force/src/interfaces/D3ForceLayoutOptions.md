# Interface: D3ForceLayoutOptions

Defined in: [graph-layout-d3-force/src/types.ts:22](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L22)

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

Defined in: [graph-layout-d3-force/src/types.ts:25](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L25)

`simulation.alpha(alpha)`.

***

### alphaDecay?

> `optional` **alphaDecay?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:29](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L29)

`simulation.alphaDecay(decay)`.

***

### alphaMin?

> `optional` **alphaMin?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:27](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L27)

`simulation.alphaMin(min)`.

***

### alphaTarget?

> `optional` **alphaTarget?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:31](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L31)

`simulation.alphaTarget(target)`.

***

### center?

> `optional` **center?**: [`CenterForceOptions`](CenterForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:41](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L41)

`forceCenter` — translates the cluster's centroid to `(x, y)`.

***

### charge?

> `optional` **charge?**: [`ChargeForceOptions`](ChargeForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:39](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L39)

`forceManyBody` — n-body charge (negative = repulsion).

***

### collide?

> `optional` **collide?**: [`CollideForceOptions`](CollideForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:43](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L43)

`forceCollide` — prevents overlap.

***

### link?

> `optional` **link?**: [`LinkForceOptions`](LinkForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:37](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L37)

`forceLink` — pulls connected nodes toward a target distance.

***

### radial?

> `optional` **radial?**: [`RadialForceOptions`](RadialForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:49](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L49)

`forceRadial` — pulls toward a circle of given radius. Requires `radius`.

***

### velocityDecay?

> `optional` **velocityDecay?**: `number`

Defined in: [graph-layout-d3-force/src/types.ts:33](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L33)

`simulation.velocityDecay(decay)`.

***

### x?

> `optional` **x?**: [`PositionXForceOptions`](PositionXForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:45](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L45)

`forceX` — positioning force along x.

***

### y?

> `optional` **y?**: [`PositionYForceOptions`](PositionYForceOptions.md)

Defined in: [graph-layout-d3-force/src/types.ts:47](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/graph-layout-d3-force/src/types.ts#L47)

`forceY` — positioning force along y.
