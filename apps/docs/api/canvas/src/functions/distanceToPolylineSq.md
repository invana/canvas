# Function: distanceToPolylineSq()

> **distanceToPolylineSq**(`poly`, `px`, `py`): `number`

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:632](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/connectors/pathSampling.ts#L632)

Squared minimum distance from `(px, py)` to any segment of the polyline.
Squared (no sqrt) so callers can compare against a squared tolerance —
faster + branch-free for the common no-hit case.

## Parameters

### poly

readonly `Point`[]

### px

`number`

### py

`number`

## Returns

`number`
