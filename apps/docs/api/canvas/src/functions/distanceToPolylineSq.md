# Function: distanceToPolylineSq()

> **distanceToPolylineSq**(`poly`, `px`, `py`): `number`

Defined in: [canvas/src/primitives/connectors/pathSampling.ts:632](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/connectors/pathSampling.ts#L632)

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
