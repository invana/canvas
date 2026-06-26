# Type Alias: ClickSelectEventMap

> **ClickSelectEventMap** = `object`

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:60](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L60)

Event-map for [ClickSelectBehaviour.events](../classes/ClickSelectBehaviour.md#events).

## Properties

### selection:change

> **selection:change**: [`SelectionSnapshot`](../interfaces/SelectionSnapshot.md)

Defined in: [graph/src/behaviours/ClickSelectBehaviour.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/ClickSelectBehaviour.ts#L67)

Fired once whenever the selection set is replaced (click, `select*`,
`clearSelection`, or brush/lasso delegation). The non-clobbering complement
to the `onSelectionChange` callback — observers (e.g. the canvas-react
`useSelection` hook) subscribe here instead of hijacking the callback.
