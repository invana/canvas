# Function: animatePositions()

> **animatePositions**(`opts`): [`PositionTransition`](../interfaces/PositionTransition.md)

Defined in: [canvas/src/layouts/animatePositions.ts:64](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layouts/animatePositions.ts#L64)

Tween a set of node positions from `from` to `to` over `duration` ms,
self-driven on `requestAnimationFrame`.

One-shot layouts (ELK, d3-hierarchy, d3-sankey, …) compute a final position
set in a single pass and would otherwise `setPositionsBulk` it in one write,
teleporting every node. Routing that final buffer through `animatePositions`
instead glides each node from where it currently sits to its computed slot —
a far more legible layout switch / re-layout.

The `Layout` base class is deliberately canvas-agnostic (it owns no RAF), so
this helper drives its own frame loop — mirroring how `D3ForceLayout` rides
d3's internal timer. It is store-agnostic: it only interpolates buffers and
hands each frame back via `onFrame`; the caller owns the write.

Cancellation: call `cancel()` (typically from the layout's `stop()` or its
next `apply()`) to abort cleanly — the next run can start a fresh transition
from wherever the nodes currently are. SSR-safe and degenerate-input-safe:
with no `requestAnimationFrame`, a non-positive `duration`, or an empty set,
it writes the final positions once and completes synchronously.

## Parameters

### opts

[`PositionTransitionOptions`](../interfaces/PositionTransitionOptions.md)

## Returns

[`PositionTransition`](../interfaces/PositionTransition.md)

## Throws

if `from.length !== to.length`.
