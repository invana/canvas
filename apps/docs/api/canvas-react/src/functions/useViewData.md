# Function: useViewData()

> **useViewData**(`options?`, `canvas?`): [`ViewData`](../interfaces/ViewData.md)

Defined in: [canvas-react/src/hooks/useViewData.ts:62](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewData.ts#L62)

Click-driven, **read-only** property data for a viewer. Returns the single
node or edge the user clicked to view — its effective label, `type`, `data`
(and, for edges, `source`/`target`) — or `null` when nothing is targeted (so
a panel can render nothing). Reads the target via [useViewTarget](useViewTarget.md) (needs
a `ClickViewBehaviour`, independent of selection).

The read-only analogue of [useEntityEditor](useEntityEditor.md): no `commit` — it never
writes to the store. The view (`<PropertyDetailView>`) and placement are the
consumer's — see `NodeDetailView` / `EdgeDetailView` for the turnkey wiring.

## Parameters

### options?

[`UseViewDataOptions`](../interfaces/UseViewDataOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`ViewData`](../interfaces/ViewData.md)
