# Interface: BubbleSetsLayerOptions

Defined in: [graph-layer-bubble-sets/src/types.ts:74](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L74)

Options for [BubbleSetsLayer](../classes/BubbleSetsLayer.md). The shape mirrors
`@invana/graph-layer-d3-contour`: cross-layer dep + algorithm knobs +
`recompute` lifecycle, all optional except `graphLayerId` and `sets`.

## Properties

### chaikinIterations?

> `optional` **chaikinIterations?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:142](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L142)

Number of Chaikin corner-cutting iterations when [smoothness](#smoothness) is
`'chaikin'`. Each iteration doubles the point count and rounds every
corner further; `4` is enough for visually smooth curves on graph-sized
inputs. Ignored otherwise. Default `4`.

***

### edgeR0?

> `optional` **edgeR0?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:103](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L103)

Edge-influence inner / outer radii (world units). Defaults: `10` / `20`.

***

### edgeR1?

> `optional` **edgeR1?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:104](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L104)

***

### graphLayerId

> **graphLayerId**: `string`

Defined in: [graph-layer-bubble-sets/src/types.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L80)

Required. Id of the `GraphLayer` whose nodes feed the algorithm. Per
canvas architecture: cross-layer deps are declared explicitly, never
inferred. Throws on mount if the id can't be resolved.

***

### maxMarchingIterations?

> `optional` **maxMarchingIterations?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:121](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L121)

Max marching-squares refinement iterations. Default `20`.

***

### maxRoutingIterations?

> `optional` **maxRoutingIterations?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:116](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L116)

Max routing iterations the algorithm runs to find a path that wraps
obstacles. Default `100`.

***

### morphBuffer?

> `optional` **morphBuffer?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:110](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L110)

Padding added around the energy grid before sampling — keeps the
contour from clipping against the grid border. World units. Default `10`.

***

### nodeR0?

> `optional` **nodeR0?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:97](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L97)

Node-influence inner / outer radii (world units). Members attract the
contour out to [nodeR0](#noder0) (full influence) and fall off to
[nodeR1](#noder1) (zero influence); non-members repel over the same
envelope. Defaults: `15` / `50`.

***

### nodeR1?

> `optional` **nodeR1?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:98](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L98)

***

### pixelGroup?

> `optional` **pixelGroup?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:89](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L89)

Grid resolution in square world units. Smaller = sharper contours but
quadratically more compute. `bubblesets-js` default: `4`.

***

### recompute?

> `optional` **recompute?**: `"auto"` \| `"manual"`

Defined in: [graph-layer-bubble-sets/src/types.ts:150](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L150)

Recompute trigger:
- `'auto'` (default) — subscribe to the source layer's `data:changed`
  and recompute on a debounce.
- `'manual'` — caller drives recompute via `layer.recompute()`.

***

### recomputeDebounceMs?

> `optional` **recomputeDebounceMs?**: `number`

Defined in: [graph-layer-bubble-sets/src/types.ts:153](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L153)

Debounce window for `auto` recomputes. Default `120` ms.

***

### sets

> **sets**: readonly [`BubbleSet`](BubbleSet.md)[]

Defined in: [graph-layer-bubble-sets/src/types.ts:83](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L83)

Initial set list. May be mutated post-mount via [BubbleSetsLayer.setSets](../classes/BubbleSetsLayer.md#setsets).

***

### smoothness?

> `optional` **smoothness?**: `"none"` \| `"chaikin"` \| `"bspline"`

Defined in: [graph-layer-bubble-sets/src/types.ts:134](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph-layer-bubble-sets/src/types.ts#L134)

Contour smoothing.
- `'chaikin'` (default) — Chaikin's corner-cutting subdivision applied
  to a sparsified copy of the marching-squares polyline. Produces the
  roundest, most organic curves; the iteration count is tunable via
  [chaikinIterations](#chaikiniterations).
- `'bspline'` — `PointPath.sample().bSplines()`, the canonical
  `bubblesets-js` / G6 pipeline. Slightly tighter to the member nodes
  than Chaikin, less "puffy".
- `'none'` — raw marching-squares polyline (jagged).
