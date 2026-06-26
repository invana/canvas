# Type Alias: ClickInspectEventMap

> **ClickInspectEventMap** = `object`

Defined in: [graph/src/behaviours/ClickInspectBehaviour.ts:41](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickInspectBehaviour.ts#L41)

Event-map for [ClickInspectBehaviour.events](../classes/ClickInspectBehaviour.md#events).

## Properties

### inspect:change

> **inspect:change**: [`InspectTarget`](../interfaces/InspectTarget.md) \| `null`

Defined in: [graph/src/behaviours/ClickInspectBehaviour.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickInspectBehaviour.ts#L46)

Fired whenever the inspected element changes — a node / edge click sets it,
a background click (or `clear`) sets it to `null`.
