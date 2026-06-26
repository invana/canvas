# Type Alias: ClickViewEventMap

> **ClickViewEventMap** = `object`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:43](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L43)

Event-map for [ClickViewBehaviour.events](../classes/ClickViewBehaviour.md#events).

## Properties

### view:change

> **view:change**: [`ViewTarget`](../interfaces/ViewTarget.md) \| `null`

Defined in: [graph/src/behaviours/ClickViewBehaviour.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickViewBehaviour.ts#L48)

Fired whenever the viewed element changes — a node / edge click sets it,
a background click (or `clear`) sets it to `null`.
