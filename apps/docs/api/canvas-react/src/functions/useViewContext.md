# Function: useViewContext()

> **useViewContext**(`options?`, `canvas?`): [`ViewContext`](../interfaces/ViewContext.md)

Resolves the single clicked node/edge to a full [ViewContext](../interfaces/ViewContext.md) — the
read-only display fields ([useViewData](useViewData.md)) plus the raw entity and engine
handles — or `null` when nothing is targeted. This is what a custom viewer UI
receives; see `<ClickViewBehaviour panel={…}>`.

## Parameters

### options?

[`UseViewDataOptions`](../interfaces/UseViewDataOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`ViewContext`](../interfaces/ViewContext.md)
