# Type Alias: ClickSelectEventMap

> **ClickSelectEventMap** = `object`

Event-map for [ClickSelectBehaviour.events](../classes/ClickSelectBehaviour.md#events).

## Properties

### selection:change

> **selection:change**: [`SelectionSnapshot`](../interfaces/SelectionSnapshot.md)

Fired once whenever the selection set is replaced (click, `select*`,
`clearSelection`, or brush/lasso delegation). The non-clobbering complement
to the `onSelectionChange` callback — observers (e.g. the canvas-react
`useSelection` hook) subscribe here instead of hijacking the callback.
