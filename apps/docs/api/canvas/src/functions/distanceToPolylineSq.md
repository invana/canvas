# Function: distanceToPolylineSq()

> **distanceToPolylineSq**(`poly`, `px`, `py`): `number`

Defined in: packages/canvas/src/primitives/connectors/pathSampling.ts:187

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
