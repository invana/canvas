# Function: distanceToPolylineSq()

> **distanceToPolylineSq**(`poly`, `px`, `py`): `number`

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:596](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/connectors/pathSampling.ts#L596)

Squared minimum distance from `(px, py)` to any segment of the polyline.
Squared (no sqrt) so callers can compare against a squared tolerance —
faster + branch-free for the common no-hit case.

## Parameters

### poly

readonly [`Point`](../interfaces/Point.md)[]

### px

`number`

### py

`number`

## Returns

`number`
