# Interface: LayoutPositions\<M\>

Defined in: [graph/src/layout/OneShotPositionLayout.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L20)

The position set a [OneShotPositionLayout](../classes/OneShotPositionLayout.md) subclass computes for a run.

`positions` is a flat `Float32Array` of length `ids.length * 2` — `x, y`
interleaved per id, the shape `GraphStore.setPositionsBulk` consumes. Return
`null` (or an empty `ids`) to no-op the run (e.g. no nodes, no root).

## Type Parameters

### M

`M` = `unknown`

## Properties

### ids

> **ids**: `string`[]

Defined in: [graph/src/layout/OneShotPositionLayout.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L21)

***

### meta?

> `optional` **meta?**: `M`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L30)

Optional per-run payload threaded back to [OneShotPositionLayout.onPositionsApplied](../classes/OneShotPositionLayout.md#onpositionsapplied)
after the positions settle — e.g. derived geometry that depends on the final
positions (ELK edge waypoints, circle-pack sizes, sunburst arcs). Threaded
through the run rather than stashed on the instance, so overlapping runs
can't clobber each other.

***

### positions

> **positions**: `Float32Array`

Defined in: [graph/src/layout/OneShotPositionLayout.ts:22](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layout/OneShotPositionLayout.ts#L22)
