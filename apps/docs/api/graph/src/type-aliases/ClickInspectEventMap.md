# Type Alias: ClickInspectEventMap

> **ClickInspectEventMap** = `object`

Event-map for [ClickInspectBehaviour.events](../classes/ClickInspectBehaviour.md#events).

## Properties

### inspect:change

> **inspect:change**: [`InspectTarget`](../interfaces/InspectTarget.md) \| `null`

Fired whenever the inspected element changes — a node / edge click sets it,
a background click (or `clear`) sets it to `null`.
