# Interface: BubbleSetsLayerOptions

The subset of `BubbleSetsLayerOptions` this editor produces — a serialisable
patch. The `graphLayerId` cross-layer identity and the `sets` group
membership (node/edge id lists + per-set labels) are out of scope; the
remaining algorithm knobs plus a default BubbleSetStyle round-trip.

## Properties

### chaikinIterations?

> `optional` **chaikinIterations?**: `number`

Chaikin corner-cutting iterations (used only when `smoothness === 'chaikin'`).

***

### edgeR0?

> `optional` **edgeR0?**: `number`

Edge-influence inner radius, world units.

***

### edgeR1?

> `optional` **edgeR1?**: `number`

Edge-influence outer radius, world units.

***

### maxMarchingIterations?

> `optional` **maxMarchingIterations?**: `number`

Max marching-squares refinement iterations.

***

### maxRoutingIterations?

> `optional` **maxRoutingIterations?**: `number`

Max routing iterations to wrap obstacles.

***

### morphBuffer?

> `optional` **morphBuffer?**: `number`

Padding around the energy grid before sampling, world units.

***

### nodeR0?

> `optional` **nodeR0?**: `number`

Node-influence inner radius (full influence), world units.

***

### nodeR1?

> `optional` **nodeR1?**: `number`

Node-influence outer radius (zero influence), world units.

***

### pixelGroup?

> `optional` **pixelGroup?**: `number`

Grid resolution in square world units. Smaller = sharper, costlier.

***

### recompute?

> `optional` **recompute?**: `BubbleSetsRecompute`

Recompute trigger.

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Debounce window for `auto` recomputes, in ms.

***

### smoothness?

> `optional` **smoothness?**: `BubbleSetsSmoothness`

Contour smoothing algorithm.

***

### style?

> `optional` **style?**: `BubbleSetStyle`

Default per-set visual style.
